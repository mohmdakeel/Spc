package com.example.Authservice1.service;

import com.example.Authservice1.model.Registration;
import com.example.Authservice1.repository.RegistrationRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    @Nullable private final Cloudinary cloudinary;

    @Autowired
    public RegistrationService(RegistrationRepository registrationRepository,
                               @Nullable Cloudinary cloudinary) {
        this.registrationRepository = registrationRepository;
        this.cloudinary = cloudinary;
    }

    /** UI listing (deleted=false only) */
    public List<Registration> getAllRegistrations() {
        return registrationRepository.findByDeletedFalse();
    }

    /** Controller paging helper */
    public Page<Registration> findAll(Pageable pageable, String q) {
        String qq = (q == null || q.isBlank()) ? null : q.toLowerCase();
        if (qq != null) {
            // uses @Query search(...) (already filters deleted=false)
            return registrationRepository.search(qq, pageable);
        }
        // simple page of non-deleted
        return registrationRepository.findAllByDeletedFalse(pageable);
    }

    /** Export helper – in-memory filtering; no custom repo methods required */
    public List<Registration> listForExport(String q, String fromStr, String toStr, String department) {
        LocalDateTime from = parseStart(fromStr);
        LocalDateTime to   = parseEnd(toStr);
        String qq = (q == null || q.isBlank()) ? null : q.toLowerCase();
        String dep = (department == null || department.isBlank()) ? null : department.trim().toLowerCase();

        return registrationRepository.findByDeletedFalse().stream()
                .filter(r -> qq == null || matchesRegQuery(r, qq))
                .filter(r -> dep == null || (r.getDepartment() != null
                        && r.getDepartment().toLowerCase().contains(dep)))
                .filter(r -> between(r.getAddedTime(), from, to))
                .sorted(Comparator.comparing(Registration::getId))
                .toList();
    }

    private boolean matchesRegQuery(Registration r, String q) {
        return str(r.getEpfNo()).contains(q)
            || str(r.getFullName()).contains(q)
            || str(r.getNameWithInitials()).contains(q)
            || str(r.getSurname()).contains(q)
            || str(r.getNicNo()).contains(q)
            || str(r.getDistrict()).contains(q)
            || str(r.getMobileNo()).contains(q)
            || str(r.getPersonalEmail()).contains(q)
            || str(r.getWorkingStatus()).contains(q)
            || str(r.getDepartment()).contains(q);
    }
    private String str(String s) { return s == null ? "" : s.toLowerCase(); }
    private boolean between(LocalDateTime t, LocalDateTime from, LocalDateTime to) {
        if (t == null) return true;
        if (from != null && t.isBefore(from)) return false;
        if (to   != null && !t.isBefore(to))  return false; // [from, to)
        return true;
    }
    private LocalDateTime parseStart(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return null;
        try { return LocalDate.parse(isoDate).atStartOfDay(); }
        catch (DateTimeParseException e) { return null; }
    }
    private LocalDateTime parseEnd(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return null;
        try { return LocalDate.parse(isoDate).plusDays(1).atStartOfDay(); }
        catch (DateTimeParseException e) { return null; }
    }

    // ---------- CRUD ----------

    public Registration getRegistrationById(Long id) {
        return registrationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
    }

    public Registration createRegistration(Registration registration, MultipartFile imageFile) throws IOException {
        registration.setAddedTime(LocalDateTime.now());
        if (imageFile != null && !imageFile.isEmpty()) {
            ensureCloudinaryConfigured();
            Map<?, ?> uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
            registration.setImageUrl(uploadResult.get("url").toString());
        }
        return registrationRepository.save(registration);
    }

    public Registration updateRegistration(Long id, Registration updatedData, MultipartFile imageFile) throws IOException {
        Registration existing = registrationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));

        // copy fields
        existing.setEpfNo(updatedData.getEpfNo());
        existing.setAttendanceNo(updatedData.getAttendanceNo());
        existing.setNameWithInitials(updatedData.getNameWithInitials());
        existing.setSurname(updatedData.getSurname());
        existing.setFullName(updatedData.getFullName());
        existing.setNicNo(updatedData.getNicNo());
        existing.setDateOfBirth(updatedData.getDateOfBirth());
        existing.setCivilStatus(updatedData.getCivilStatus());
        existing.setGender(updatedData.getGender());
        existing.setRace(updatedData.getRace());
        existing.setReligion(updatedData.getReligion());
        existing.setBloodGroup(updatedData.getBloodGroup());
        existing.setPermanentAddress(updatedData.getPermanentAddress());
        existing.setDistrict(updatedData.getDistrict());
        existing.setMobileNo(updatedData.getMobileNo());
        existing.setPersonalEmail(updatedData.getPersonalEmail());
        existing.setCardStatus(updatedData.getCardStatus());
        existing.setImageUrl(updatedData.getImageUrl());
        existing.setCurrentAddress(updatedData.getCurrentAddress());
        existing.setDsDivision(updatedData.getDsDivision());
        existing.setResidencePhone(updatedData.getResidencePhone());
        existing.setEmergencyContact(updatedData.getEmergencyContact());
        existing.setWorkingStatus(updatedData.getWorkingStatus());
        existing.setDepartment(updatedData.getDepartment());
        existing.setModifiedTime(LocalDateTime.now());

        if (imageFile != null && !imageFile.isEmpty()) {
            ensureCloudinaryConfigured();
            Map<?, ?> uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
            existing.setImageUrl(uploadResult.get("url").toString());
        }
        return registrationRepository.save(existing);
    }

    public void deleteRegistration(Long id, String deletedBy) {
        Registration existing = registrationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
        existing.markAsDeleted(deletedBy); // sets deleted=true, deletedTime, deletedBy
        registrationRepository.save(existing);
    }

    private void ensureCloudinaryConfigured() {
        if (this.cloudinary == null) {
            throw new IllegalStateException("Image upload is disabled: Cloudinary is not configured.");
        }
    }
}
