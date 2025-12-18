package com.example.Transport.controller;

import com.example.Transport.common.ApiResponse;
import com.example.Transport.dto.*;
import com.example.Transport.entity.UsageRequest;
import com.example.Transport.enums.RequestStatus;
import com.example.Transport.service.HistoryService;
import com.example.Transport.service.UsageRequestService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/usage-requests")
@Validated
public class UsageRequestController {

  private final UsageRequestService service;
  private final HistoryService historyService;

  public UsageRequestController(UsageRequestService service, HistoryService historyService) {
    this.service = service;
    this.historyService = historyService;
  }

  /* Create by Department (DTO validated) */
  @PostMapping
  public ApiResponse<UsageRequest> create(@Valid @RequestBody CreateUsageRequestDto dto) {
    return ApiResponse.ok(service.create(dto));
  }

  /* Read (PAGED general) */
  @GetMapping
  public ApiResponse<Page<UsageRequest>> list(
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(200) int size,
      @RequestParam(defaultValue = "createdAt") String sort,
      @RequestParam(defaultValue = "DESC") String dir,
      @RequestParam(required = false) RequestStatus status
  ) {
    Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
    Page<UsageRequest> result = (status == null)
        ? service.listPaged(pageable)
        : service.listByStatusPaged(status, pageable);
    return ApiResponse.ok(result);
  }

  /* Applicant "My Requests" (paged) */
  @GetMapping("/my")
  public ApiResponse<Page<UsageRequest>> myRequests(
      @RequestParam String employeeId,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(200) int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ApiResponse.ok(service.listMine(employeeId, pageable));
  }

  /* HOD department queues */
  @GetMapping("/department")
  public ApiResponse<Page<UsageRequest>> departmentQueue(
      @RequestParam String department,
      @RequestParam RequestStatus status,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(200) int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ApiResponse.ok(service.listDepartment(department, status, pageable));
  }

  /* Management pending queue */
  @GetMapping("/mgmt/pending")
  public ApiResponse<Page<UsageRequest>> managementQueue(
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(200) int size
  ) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return ApiResponse.ok(service.listManagementQueue(pageable));
  }

  /* Legacy non-paged (optional) */
  @GetMapping("/all")
  public ApiResponse<List<UsageRequest>> listAll() {
    return ApiResponse.ok(service.listAll());
  }

  @GetMapping("/{id}")
  public ApiResponse<UsageRequest> get(@PathVariable Long id) {
    return ApiResponse.ok(service.get(id));
  }

  @GetMapping("/status/{status}")
  public ApiResponse<List<UsageRequest>> listByStatus(@PathVariable String status) {
    RequestStatus st = RequestStatus.valueOf(status);
    return ApiResponse.ok(service.listByStatus(st));
  }

  /* HOD actions */
  @PostMapping("/{id}/hod/approve")
  public ApiResponse<UsageRequest> hodApprove(@PathVariable Long id, @Valid @RequestBody ActionDto dto) {
    return ApiResponse.ok(service.hodApprove(id, dto));
  }

  @PostMapping("/{id}/hod/reject")
  public ApiResponse<UsageRequest> hodReject(@PathVariable Long id, @Valid @RequestBody ActionDto dto) {
    return ApiResponse.ok(service.hodReject(id, dto));
  }

  /* Management actions */
  @PostMapping("/{id}/mgmt/approve")
  public ApiResponse<UsageRequest> mgmtApprove(@PathVariable Long id, @Valid @RequestBody ActionDto dto) {
    return ApiResponse.ok(service.mgmtApprove(id, dto));
  }

  @PostMapping("/{id}/mgmt/reject")
  public ApiResponse<UsageRequest> mgmtReject(@PathVariable Long id, @Valid @RequestBody ActionDto dto) {
    return ApiResponse.ok(service.mgmtReject(id, dto));
  }

  /* Assign (In-charge) */
  @PostMapping("/{id}/assign")
  public ApiResponse<UsageRequest> assign(@PathVariable Long id, @Valid @RequestBody AssignRequestDto dto) {
    return ApiResponse.ok(service.assign(id, dto));
  }

  /* Gate */
  @PostMapping("/{id}/gate/exit")
  public ApiResponse<UsageRequest> gateExit(@PathVariable Long id, @Valid @RequestBody(required = false) GateExitDto dto) {
    return ApiResponse.ok(service.gateExit(id, dto != null ? dto : new GateExitDto()));
  }

  @PostMapping("/{id}/gate/entry")
  public ApiResponse<UsageRequest> gateEntry(@PathVariable Long id, @Valid @RequestBody(required = false) GateEntryDto dto) {
    return ApiResponse.ok(service.gateEntry(id, dto != null ? dto : new GateEntryDto()));
  }

  /* Metrics */
  @GetMapping("/metrics")
  public ApiResponse<MetricsDto> metrics(
      @RequestParam(value = "from", required = false)
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

      @RequestParam(value = "to", required = false)
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
  ) {
    return ApiResponse.ok(service.metrics(from, to));
  }

  /* Print-friendly view */
  @GetMapping("/{id}/print")
  public ApiResponse<RequestPrintDto> printView(@PathVariable Long id) {
    return ApiResponse.ok(service.printDto(id));
  }

  /* History for a specific request */
  @GetMapping("/{id}/history")
  public ApiResponse<List<com.example.Transport.history.dto.HistoryRecordDto>> history(@PathVariable Long id) {
    return ApiResponse.ok(historyService.timeline("UsageRequest", String.valueOf(id)));
  }

  /* Gate logs (default = today UTC) */
  @GetMapping("/gate/logs")
  public ApiResponse<List<GateLogRow>> gateLogs(
      @RequestParam(value = "day", required = false)
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day
  ) {
    return ApiResponse.ok(service.gateLogs(day));
  }
}
