package com.example.authservice.service;

import com.example.authservice.dto.CreateRegistrationRequest;
import com.example.authservice.dto.UpdateRegistrationRequest;
import com.example.authservice.model.Registration;
import com.example.authservice.repository.RegistrationRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RegistrationService {
  private final RegistrationRepository repo;
  private final AuditService audit;
  private final UserRepository users;

  private static final String PROTECTED_USERNAME = "admin1";

  private String protectedAdminEpf() {
    return users.findByUsername(PROTECTED_USERNAME)
      .map(u -> u.getEpfNo() == null ? "" : u.getEpfNo())
      .orElse("EPF-0001"); // fallback to your seed EPF
  }

  private void guardProtectedEpf(String epfNo, String op) {
    if (epfNo != null && epfNo.equalsIgnoreCase(protectedAdminEpf())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Registration for admin1 is protected: cannot " + op + ".");
    }
  }

  public Registration create(CreateRegistrationRequest req) {
    var r = Registration.builder()
      .epfNo(req.getEpfNo().trim())
      .attendanceNo(req.getAttendanceNo())
      .nameWithInitials(req.getNameWithInitials())
      .surname(req.getSurname())
      .fullName(req.getFullName())
      .nicNo(req.getNicNo())
      .dateOfBirth(req.getDateOfBirth())
      .civilStatus(req.getCivilStatus())
      .gender(req.getGender())
      .race(req.getRace())
      .religion(req.getReligion())
      .bloodGroup(req.getBloodGroup())
      .permanentAddress(req.getPermanentAddress())
      .district(req.getDistrict())
      .mobileNo(req.getMobileNo())
      .personalEmail(req.getPersonalEmail())
      .cardStatus(req.getCardStatus())
      .imageUrl(req.getImageUrl())
      .currentAddress(req.getCurrentAddress())
      .dsDivision(req.getDsDivision())
      .residencePhone(req.getResidencePhone())
      .emergencyContact(req.getEmergencyContact())
      .workingStatus(req.getWorkingStatus())
      .department(req.getDepartment())
      .build();
    var saved = repo.save(r);
    audit.log(actor(), "CREATE", "Registration", String.valueOf(saved.getId()), "{\"epf\":\"" + saved.getEpfNo() + "\"}");
    return saved;
  }

  public List<Registration> list() { return repo.findAllByDeletedFalseOrderByEpfNoAsc(); }

  public Registration getByEpf(String epfNo) {
    return repo.findByEpfNoAndDeletedFalse(epfNo).orElseThrow(() -> new IllegalArgumentException("Registration not found"));
  }

  public Registration update(String epfNo, UpdateRegistrationRequest req) {
    guardProtectedEpf(epfNo, "update");
    var r = getByEpf(epfNo);
    if (req.getAttendanceNo() != null) r.setAttendanceNo(req.getAttendanceNo());
    if (req.getNameWithInitials() != null) r.setNameWithInitials(req.getNameWithInitials());
    if (req.getSurname() != null) r.setSurname(req.getSurname());
    if (req.getFullName() != null) r.setFullName(req.getFullName());
    if (req.getNicNo() != null) r.setNicNo(req.getNicNo());
    if (req.getDateOfBirth() != null) r.setDateOfBirth(req.getDateOfBirth());
    if (req.getCivilStatus() != null) r.setCivilStatus(req.getCivilStatus());
    if (req.getGender() != null) r.setGender(req.getGender());
    if (req.getRace() != null) r.setRace(req.getRace());
    if (req.getReligion() != null) r.setReligion(req.getReligion());
    if (req.getBloodGroup() != null) r.setBloodGroup(req.getBloodGroup());
    if (req.getPermanentAddress() != null) r.setPermanentAddress(req.getPermanentAddress());
    if (req.getDistrict() != null) r.setDistrict(req.getDistrict());
    if (req.getMobileNo() != null) r.setMobileNo(req.getMobileNo());
    if (req.getPersonalEmail() != null) r.setPersonalEmail(req.getPersonalEmail());
    if (req.getCardStatus() != null) r.setCardStatus(req.getCardStatus());
    if (req.getImageUrl() != null) r.setImageUrl(req.getImageUrl());
    if (req.getCurrentAddress() != null) r.setCurrentAddress(req.getCurrentAddress());
    if (req.getDsDivision() != null) r.setDsDivision(req.getDsDivision());
    if (req.getResidencePhone() != null) r.setResidencePhone(req.getResidencePhone());
    if (req.getEmergencyContact() != null) r.setEmergencyContact(req.getEmergencyContact());
    if (req.getWorkingStatus() != null) r.setWorkingStatus(req.getWorkingStatus());
    if (req.getDepartment() != null) r.setDepartment(req.getDepartment());
    var saved = repo.save(r);
    audit.log(actor(), "UPDATE", "Registration", String.valueOf(saved.getId()), "{\"epf\":\"" + saved.getEpfNo() + "\"}");
    return saved;
  }

  public void softDelete(String epfNo) {
    guardProtectedEpf(epfNo, "delete");
    var r = getByEpf(epfNo);
    r.markAsDeleted(actor());
    repo.save(r);
    audit.log(actor(), "DELETE", "Registration", String.valueOf(r.getId()), "{\"epf\":\"" + r.getEpfNo() + "\"}");
  }

  private String actor() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a == null ? "system" : a.getName();
  }
}
