package com.example.Transport.service;

import com.example.Transport.dto.*;
import com.example.Transport.entity.UsageRequest;
import com.example.Transport.entity.Vehicle;
import com.example.Transport.enums.RequestStatus;
import com.example.Transport.enums.VehicleStatus;
import com.example.Transport.exception.BadRequestException;
import com.example.Transport.exception.ConflictException;
import com.example.Transport.exception.NotFoundException;
import com.example.Transport.repository.UsageRequestRepository;
import com.example.Transport.repository.VehicleRepository;
import com.example.Transport.util.HistoryRecorder;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UsageRequestService {

  private final UsageRequestRepository repo;
  private final VehicleRepository vehicleRepo;
  private final HistoryRecorder history;
  private final ObjectMapper objectMapper;

  private static final int BUFFER_MINUTES = 15;

  private static LocalDateTime utcNow() { return LocalDateTime.now(ZoneOffset.UTC); }

  private Optional<Vehicle> resolveVehicle(UsageRequest r) {
    if (r.getAssignedVehicleId() != null) {
      return vehicleRepo.findById(r.getAssignedVehicleId());
    }
    if (r.getAssignedVehicleNumber() != null && !r.getAssignedVehicleNumber().isBlank()) {
      String num = r.getAssignedVehicleNumber().trim();
      return vehicleRepo.findByVehicleNumberAndIsDeleted(num, 0)
          .or(() -> vehicleRepo.findByVehicleNumberCaseInsensitive(num, 0));
    }
    return Optional.empty();
  }

  /* -------------------- CREATE -------------------- */

  public UsageRequest create(CreateUsageRequestDto dto) {
    validateCreate(dto);

    UsageRequest r = new UsageRequest();
    r.setRequestCode(genCode());
    r.setApplicantName(trim(dto.applicantName));
    r.setEmployeeId(trim(dto.employeeId));
    r.setDepartment(trim(dto.department));

    // NEW: appliedDate (default to today UTC if not provided)
    r.setAppliedDate(dto.appliedDate != null ? dto.appliedDate : LocalDate.now(ZoneOffset.UTC));

    r.setDateOfTravel(dto.dateOfTravel);
    LocalTime from = parseHm(dto.timeFrom);
    LocalTime to   = parseHm(dto.timeTo);
    r.setTimeFrom(from);
    r.setTimeTo(to);
    r.setOvernight(isOvernight(from, to));

    r.setFromLocation(trim(dto.fromLocation));
    r.setToLocation(trim(dto.toLocation));
    r.setOfficialDescription(trim(dto.officialDescription));
    r.setGoods(trim(dto.goods));

    // NEW: officer fields
    r.setTravelWithOfficer(Boolean.TRUE.equals(dto.travelWithOfficer));
    r.setOfficerName(trim(dto.officerName));
    r.setOfficerId(trim(dto.officerId));
    r.setOfficerPhone(trim(dto.officerPhone));

    r.setStatus(RequestStatus.PENDING_HOD);

    UsageRequest saved = repo.save(r);
    history.record("UsageRequest", String.valueOf(saved.getId()), "Created", null, saved, "system");
    return saved;
  }

  private void validateCreate(CreateUsageRequestDto dto) {
    if (isBlank(dto.applicantName) || isBlank(dto.employeeId) || isBlank(dto.department))
      throw new BadRequestException("Applicant, Employee ID and Department are required");
    if (dto.dateOfTravel == null)
      throw new BadRequestException("dateOfTravel is required");
    if (isBlank(dto.timeFrom) || isBlank(dto.timeTo))
      throw new BadRequestException("timeFrom and timeTo are required");
    if (isBlank(dto.fromLocation) || isBlank(dto.toLocation))
      throw new BadRequestException("From/To locations are required");

    if (dto.dateOfTravel.isBefore(LocalDate.now(ZoneOffset.UTC)))
      throw new BadRequestException("dateOfTravel cannot be in the past");

    LocalTime from = parseHm(dto.timeFrom);
    LocalTime to   = parseHm(dto.timeTo);
    if (from.equals(to))
      throw new BadRequestException("timeFrom must differ from timeTo");

    // NEW: if travelling with officer, require officerName
    if (Boolean.TRUE.equals(dto.travelWithOfficer) && isBlank(dto.officerName)) {
      throw new BadRequestException("officerName is required when travelWithOfficer is true");
    }

    // Optional: if appliedDate provided, must not be in the future
    if (dto.appliedDate != null && dto.appliedDate.isAfter(LocalDate.now(ZoneOffset.UTC))) {
      throw new BadRequestException("appliedDate cannot be in the future");
    }
  }

  /* -------------------- HOD / MGMT -------------------- */

  public UsageRequest hodApprove(Long id, ActionDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.PENDING_HOD)
      throw new BadRequestException("Only PENDING_HOD can be approved by HOD");
    requireRemarks(dto);
    UsageRequest before = cloneForHistory(r);

    r.setStatus(RequestStatus.PENDING_MANAGEMENT);
    UsageRequest saved = repo.save(r);

    history.record("UsageRequest", String.valueOf(id), "HOD_APPROVED", before, saved, dto.actor);
    return saved;
  }

  public UsageRequest hodReject(Long id, ActionDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.PENDING_HOD)
      throw new BadRequestException("Only PENDING_HOD can be rejected by HOD");
    requireRemarks(dto);
    UsageRequest before = cloneForHistory(r);

    r.setStatus(RequestStatus.REJECTED);
    UsageRequest saved = repo.save(r);

    history.record("UsageRequest", String.valueOf(id), "HOD_REJECTED", before, saved, dto.actor);
    return saved;
  }

  public UsageRequest mgmtApprove(Long id, ActionDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.PENDING_MANAGEMENT)
      throw new BadRequestException("Only PENDING_MANAGEMENT can be approved by Management");
    requireRemarks(dto);
    UsageRequest before = cloneForHistory(r);

    r.setStatus(RequestStatus.APPROVED);
    UsageRequest saved = repo.save(r);

    history.record("UsageRequest", String.valueOf(id), "MGMT_APPROVED", before, saved, dto.actor);
    return saved;
  }

  public UsageRequest mgmtReject(Long id, ActionDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.PENDING_MANAGEMENT)
      throw new BadRequestException("Only PENDING_MANAGEMENT can be rejected by Management");
    requireRemarks(dto);
    UsageRequest before = cloneForHistory(r);

    r.setStatus(RequestStatus.REJECTED);
    UsageRequest saved = repo.save(r);

    history.record("UsageRequest", String.valueOf(id), "MGMT_REJECTED", before, saved, dto.actor);
    return saved;
  }

  private void requireRemarks(ActionDto dto) {
    if (dto == null || isBlank(dto.remarks)) {
      throw new BadRequestException("Remarks are required");
    }
  }

  /* -------------------- ASSIGN (IN-CHARGE) -------------------- */

  public UsageRequest assign(Long id, AssignRequestDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.APPROVED && r.getStatus() != RequestStatus.SCHEDULED)
      throw new BadRequestException("Only APPROVED/SCHEDULED requests can be assigned");
    if (dto == null) throw new BadRequestException("Payload is required");
    if (dto.pickupAt == null || dto.expectedReturnAt == null)
      throw new BadRequestException("pickupAt and expectedReturnAt are required");
    if (!dto.expectedReturnAt.isAfter(dto.pickupAt))
      throw new BadRequestException("expectedReturnAt must be after pickupAt");
    if (dto.vehicleId == null && isBlank(dto.vehicleNumber))
      throw new BadRequestException("vehicleId or vehicleNumber is required");

    UsageRequest before = cloneForHistory(r);

    r.setAssignedVehicleId(dto.vehicleId);
    r.setAssignedVehicleNumber(trim(dto.vehicleNumber));
    r.setAssignedDriverId(dto.driverId);
    r.setAssignedDriverName(trim(dto.driverName));
    r.setAssignedDriverPhone(trim(dto.driverPhone));
    r.setScheduledPickupAt(dto.pickupAt);
    r.setScheduledReturnAt(dto.expectedReturnAt);

    LocalDateTime start = dto.pickupAt.minusMinutes(BUFFER_MINUTES);
    LocalDateTime end   = dto.expectedReturnAt.plusMinutes(BUFFER_MINUTES);
    var active = List.of(RequestStatus.SCHEDULED, RequestStatus.DISPATCHED);

    if (dto.vehicleId != null) {
      boolean vehicleOverlap = repo.existsVehicleOverlap(dto.vehicleId, start, end, r.getId(), active);
      if (vehicleOverlap) throw new ConflictException("Vehicle has overlapping schedule");
    }
    if (dto.driverId != null) {
      boolean driverOverlap = repo.existsDriverOverlap(dto.driverId, start, end, r.getId(), active);
      if (driverOverlap) throw new ConflictException("Driver has overlapping schedule");
    }

    r.setStatus(RequestStatus.SCHEDULED);
    UsageRequest saved = repo.save(r);

    history.record("UsageRequest", String.valueOf(id), "ASSIGNED", before, saved, dto.actor);
    return saved;
  }

  /* -------------------- GATE -------------------- */

  public UsageRequest gateExit(Long id, GateExitDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.SCHEDULED)
      throw new BadRequestException("Only SCHEDULED requests can log EXIT");

    UsageRequest before = cloneForHistory(r);
    r.setGateExitAt(utcNow());

    if (dto != null) {
      if (dto.exitOdometer != null && dto.exitOdometer < 0)
        throw new BadRequestException("exitOdometer must be >= 0");
      if (dto.exitOdometer != null) {
        resolveVehicle(r).ifPresent(v -> {
          if (v.getTotalKmDriven() != null && dto.exitOdometer < v.getTotalKmDriven()) {
            throw new BadRequestException("exitOdometer cannot be less than vehicle recorded odometer");
          }
          if (v.getRegisteredKm() != null && dto.exitOdometer < v.getRegisteredKm()) {
            throw new BadRequestException("exitOdometer cannot be less than registered odometer");
          }
        });
      }
      r.setExitOdometer(dto.exitOdometer);
      // sync vehicle current odometer on departure
      if (dto.exitOdometer != null) {
        resolveVehicle(r).ifPresent(v -> {
          Vehicle vBefore = cloneVehicle(v);
          v.setTotalKmDriven(dto.exitOdometer.longValue());
          v.setStatus(VehicleStatus.IN_SERVICE);
          vehicleRepo.saveAndFlush(v);
          history.record("Vehicle", String.valueOf(v.getId()), "ON_TRIP", vBefore, v, dto != null ? dto.actor : null);
        });
      }
      if (dto.exitManifest != null && !dto.exitManifest.isEmpty()) {
        try {
          r.setExitManifestJson(objectMapper.writeValueAsString(dto.exitManifest));
        } catch (Exception e) {
          throw new BadRequestException("Invalid exitManifest payload");
        }
      }
    }

    r.setStatus(RequestStatus.DISPATCHED);
    UsageRequest saved = repo.save(r);
    history.record("UsageRequest", String.valueOf(id), "GATE_EXIT", before, saved, dto != null ? dto.actor : null);

    return saved;
  }

  public UsageRequest gateEntry(Long id, GateEntryDto dto) {
    UsageRequest r = getOrThrow(id);
    if (r.getStatus() != RequestStatus.DISPATCHED)
      throw new BadRequestException("Only DISPATCHED requests can log ENTRY");

    UsageRequest before = cloneForHistory(r);
    r.setGateEntryAt(utcNow());

    Integer exitOdo  = r.getExitOdometer();
    Integer entryOdo = dto != null ? dto.entryOdometer : null;

    if (entryOdo != null) {
      if (entryOdo < 0) throw new BadRequestException("entryOdometer must be >= 0");
      if (exitOdo != null && entryOdo < exitOdo)
        throw new BadRequestException("entryOdometer must be >= exitOdometer");
      resolveVehicle(r).ifPresent(v -> {
        if (v.getTotalKmDriven() != null && entryOdo < v.getTotalKmDriven()) {
          throw new BadRequestException("entryOdometer cannot be less than vehicle recorded odometer");
        }
        if (v.getRegisteredKm() != null && entryOdo < v.getRegisteredKm()) {
          throw new BadRequestException("entryOdometer cannot be less than registered odometer");
        }
      });
      r.setEntryOdometer(entryOdo);
    }

    if (dto != null && dto.entryManifest != null && !dto.entryManifest.isEmpty()) {
      try {
        r.setEntryManifestJson(objectMapper.writeValueAsString(dto.entryManifest));
      } catch (Exception e) {
        throw new BadRequestException("Invalid entryManifest payload");
      }
    }

    r.setStatus(RequestStatus.RETURNED);
    UsageRequest saved = repo.save(r);
    history.record("UsageRequest", String.valueOf(id), "GATE_ENTRY", before, saved, dto != null ? dto.actor : null);

    // Vehicle side-effects: add km and set AVAILABLE
    resolveVehicle(saved).ifPresent(v -> {
      Vehicle vBefore = cloneVehicle(v);
      if (entryOdo != null) {
        v.setTotalKmDriven(entryOdo.longValue());
      }
      v.setStatus(VehicleStatus.AVAILABLE);
      vehicleRepo.saveAndFlush(v);
      history.record("Vehicle", String.valueOf(v.getId()), "TRIP_RETURNED", vBefore, v, dto != null ? dto.actor : null);
    });

    return saved;
  }

  /* -------------------- READ / QUEUES -------------------- */

  @Transactional(readOnly = true)
  public Page<UsageRequest> listPaged(Pageable pageable) {
    return repo.findAll(pageable);
  }

  @Transactional(readOnly = true)
  public Page<UsageRequest> listByStatusPaged(RequestStatus status, Pageable pageable) {
    if (status == null) throw new BadRequestException("status is required");
    return repo.findAllByStatus(status, pageable);
  }

  /* Applicant */
  @Transactional(readOnly = true)
  public Page<UsageRequest> listMine(String employeeId, Pageable pageable) {
    if (isBlank(employeeId)) throw new BadRequestException("employeeId is required");
    return repo.findByEmployeeIdOrderByCreatedAtDesc(employeeId.trim(), pageable);
  }

  /* HOD by department + status */
  @Transactional(readOnly = true)
  public Page<UsageRequest> listDepartment(String department, RequestStatus status, Pageable pageable) {
    if (isBlank(department)) throw new BadRequestException("department is required");
    if (status == null) throw new BadRequestException("status is required");
    return repo.findByDepartmentAndStatusOrderByCreatedAtDesc(department.trim(), status, pageable);
  }

  /* Management queue (pending management) */
  @Transactional(readOnly = true)
  public Page<UsageRequest> listManagementQueue(Pageable pageable) {
    return repo.findAllByStatus(RequestStatus.PENDING_MANAGEMENT, pageable);
  }

  /* Existing non-paged (legacy) */
  @Transactional(readOnly = true)
  public List<UsageRequest> listAll() {
    return repo.findAll().stream()
        .sorted(Comparator.comparing(UsageRequest::getCreatedAt,
                  Comparator.nullsLast(Comparator.naturalOrder())).reversed())
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<UsageRequest> listByStatus(RequestStatus status) {
    return repo.findAllByStatusOrderByCreatedAtDesc(status);
  }

  @Transactional(readOnly = true)
  public UsageRequest get(Long id) { return getOrThrow(id); }

  /* -------------------- METRICS -------------------- */

  @Transactional(readOnly = true)
  public MetricsDto metrics(LocalDate from, LocalDate to) {
    // WARNING: For very large datasets, replace with DB-level filters.
    List<UsageRequest> all = repo.findAll();

    var stream = all.stream();
    if (from != null) {
      stream = stream.filter(u -> u.getCreatedAt() != null &&
          !u.getCreatedAt().toLocalDate().isBefore(from));
    }
    if (to != null) {
      stream = stream.filter(u -> u.getCreatedAt() != null &&
          !u.getCreatedAt().toLocalDate().isAfter(to));
    }
    List<UsageRequest> filtered = stream.toList();

    MetricsDto.MetricsDtoBuilder builder = MetricsDto.builder();
    builder.total(filtered.size());

    Map<RequestStatus, Long> byStatus = new EnumMap<>(RequestStatus.class);
    for (RequestStatus s : RequestStatus.values()) byStatus.put(s, 0L);
    for (UsageRequest u : filtered) {
      byStatus.computeIfPresent(u.getStatus(), (k, v) -> v + 1);
    }
    builder.byStatus(byStatus);

    LocalDateTime now = utcNow();
    LocalDateTime next24 = now.plusDays(1);
    List<UsageRequest> upcoming = repo.findAllByStatusesOrderByPickup(
        List.of(RequestStatus.SCHEDULED, RequestStatus.DISPATCHED));

    DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    List<MetricsDto.SimpleRequestRow> rows = upcoming.stream()
        .filter(u -> u.getScheduledPickupAt() != null)
        .filter(u -> !u.getScheduledPickupAt().isAfter(next24))
        .limit(10)
        .map(u -> MetricsDto.SimpleRequestRow.builder()
            .id(u.getId())
            .requestCode(u.getRequestCode())
            .assignedVehicleNumber(u.getAssignedVehicleNumber())
            .assignedDriverName(u.getAssignedDriverName())
            .scheduledPickupAt(u.getScheduledPickupAt().format(ISO))
            .build()
        )
        .collect(Collectors.toList());

    builder.nextDayTop10(rows);
    return builder.build();
  }

  /* -------------------- PRINT & GATE LOGS -------------------- */

  @Transactional(readOnly = true)
  public RequestPrintDto printDto(Long id) {
    UsageRequest u = getOrThrow(id);
    return RequestPrintDto.builder()
        .id(u.getId())
        .requestCode(u.getRequestCode())
        .status(u.getStatus())
        .applicantName(u.getApplicantName())
        .employeeId(u.getEmployeeId())
        .department(u.getDepartment())
        .dateOfTravel(u.getDateOfTravel())
        .timeFrom(fmtHm(u.getTimeFrom()))
        .timeTo(fmtHm(u.getTimeTo()))
        .overnight(u.isOvernight())
        .fromLocation(u.getFromLocation())
        .toLocation(u.getToLocation())
        .officialDescription(u.getOfficialDescription())
        .goods(u.getGoods())
        .assignedVehicleId(u.getAssignedVehicleId())
        .assignedVehicleNumber(u.getAssignedVehicleNumber())
        .assignedDriverId(u.getAssignedDriverId())
        .assignedDriverName(u.getAssignedDriverName())
        .assignedDriverPhone(u.getAssignedDriverPhone())
        .scheduledPickupAt(u.getScheduledPickupAt())
        .scheduledReturnAt(u.getScheduledReturnAt())
        .gateExitAt(u.getGateExitAt())
        .gateEntryAt(u.getGateEntryAt())
        .exitOdometer(u.getExitOdometer())
        .entryOdometer(u.getEntryOdometer())
        .build();
  }

  @Transactional(readOnly = true)
  public List<GateLogRow> gateLogs(LocalDate day) {
    if (day == null) day = LocalDate.now(ZoneOffset.UTC);
    LocalDateTime start = day.atStartOfDay();
    LocalDateTime end   = start.plusDays(1);

    var statuses = List.of(RequestStatus.SCHEDULED, RequestStatus.DISPATCHED, RequestStatus.RETURNED);
    return repo.findScheduledBetween(start, end, statuses).stream().map(u ->
      GateLogRow.builder()
        .id(u.getId())
        .requestCode(u.getRequestCode())
        .department(u.getDepartment())
        .assignedVehicleNumber(u.getAssignedVehicleNumber())
        .assignedDriverName(u.getAssignedDriverName())
        .destination(u.getToLocation())
        .exitOdometer(u.getExitOdometer())
        .entryOdometer(u.getEntryOdometer())
        .scheduledPickupAt(u.getScheduledPickupAt())
        .scheduledReturnAt(u.getScheduledReturnAt())
        .gateExitAt(u.getGateExitAt())
        .gateEntryAt(u.getGateEntryAt())
        .status(u.getStatus())
        .build()
    ).collect(Collectors.toList());
  }

  /* -------------------- helpers -------------------- */

  private UsageRequest getOrThrow(Long id) {
    return repo.findById(id).orElseThrow(() -> new NotFoundException("Request not found"));
  }

  private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
  private static String trim(String s) { return s == null ? null : s.trim(); }

  private static LocalTime parseHm(String s) {
    try {
      return LocalTime.parse(s, DateTimeFormatter.ofPattern("HH:mm"));
    } catch (Exception e) {
      throw new BadRequestException("Invalid time format (HH:mm)");
    }
  }

  private static boolean isOvernight(LocalTime from, LocalTime to) { return to.isBefore(from); }

  private static String genCode() {
    String date = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.BASIC_ISO_DATE);
    String rand = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    return "REQ-" + date + "-" + rand;
  }

  private static String fmtHm(LocalTime t) { return t == null ? null : t.format(DateTimeFormatter.ofPattern("HH:mm")); }

  private static UsageRequest cloneForHistory(UsageRequest u) {
    UsageRequest c = new UsageRequest();
    c.setId(u.getId());
    c.setRequestCode(u.getRequestCode());
    c.setApplicantName(u.getApplicantName());
    c.setEmployeeId(u.getEmployeeId());
    c.setDepartment(u.getDepartment());
    c.setAppliedDate(u.getAppliedDate());                    // NEW
    c.setDateOfTravel(u.getDateOfTravel());
    c.setTimeFrom(u.getTimeFrom());
    c.setTimeTo(u.getTimeTo());
    c.setOvernight(u.isOvernight());
    c.setFromLocation(u.getFromLocation());
    c.setToLocation(u.getToLocation());
    c.setOfficialDescription(u.getOfficialDescription());
    c.setGoods(u.getGoods());
    c.setTravelWithOfficer(u.isTravelWithOfficer());         // NEW
    c.setOfficerName(u.getOfficerName());                    // NEW
    c.setOfficerId(u.getOfficerId());                        // NEW
    c.setOfficerPhone(u.getOfficerPhone());                  // NEW
    c.setStatus(u.getStatus());
    c.setAssignedVehicleId(u.getAssignedVehicleId());
    c.setAssignedVehicleNumber(u.getAssignedVehicleNumber());
    c.setAssignedDriverId(u.getAssignedDriverId());
    c.setAssignedDriverName(u.getAssignedDriverName());
    c.setAssignedDriverPhone(u.getAssignedDriverPhone());
    c.setScheduledPickupAt(u.getScheduledPickupAt());
    c.setScheduledReturnAt(u.getScheduledReturnAt());
    c.setGateExitAt(u.getGateExitAt());
    c.setGateEntryAt(u.getGateEntryAt());
    c.setExitOdometer(u.getExitOdometer());
    c.setEntryOdometer(u.getEntryOdometer());
    return c;
  }

  private static Vehicle cloneVehicle(Vehicle v) {
    Vehicle c = new Vehicle();
    c.setId(v.getId());
    c.setVehicleNumber(v.getVehicleNumber());
    c.setVehicleType(v.getVehicleType());
    c.setBrand(v.getBrand());
    c.setModel(v.getModel());
    c.setChassisNumber(v.getChassisNumber());
    c.setEngineNumber(v.getEngineNumber());
    c.setManufactureDate(v.getManufactureDate());
    c.setRegisteredKm(v.getRegisteredKm());
    c.setTotalKmDriven(v.getTotalKmDriven());
    c.setFuelEfficiency(v.getFuelEfficiency());
    c.setPresentCondition(v.getPresentCondition());
    c.setStatus(v.getStatus());
    c.setIsDeleted(v.getIsDeleted());
    return c;
  }
}
