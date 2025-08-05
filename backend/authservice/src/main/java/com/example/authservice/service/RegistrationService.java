package com.example.authservice.service;

import com.example.authservice.model.Registration;
import com.example.authservice.repository.RegistrationRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
@Service
public class RegistrationService {

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private Cloudinary cloudinary;

    public List<Registration> getAllRegistrations() {
        return registrationRepository.findAll();
    }

    public Registration getRegistrationById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
    }

    public Registration createRegistration(Registration registration, MultipartFile imageFile) throws IOException {
        if (imageFile != null && !imageFile.isEmpty()) {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
            registration.setImageUrl(uploadResult.get("url").toString());
        }
        return registrationRepository.save(registration);
    }

    public Registration updateRegistration(Long id, Registration updatedData, MultipartFile imageFile) throws IOException {
        Registration existing = getRegistrationById(id);

        // Copy fields
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
        existing.setCurrentAddress(updatedData.getCurrentAddress());
        existing.setDsDivision(updatedData.getDsDivision());
        existing.setResidencePhone(updatedData.getResidencePhone());
        existing.setEmergencyContact(updatedData.getEmergencyContact());
        existing.setWorkingStatus(updatedData.getWorkingStatus());

        if (imageFile != null && !imageFile.isEmpty()) {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
            existing.setImageUrl(uploadResult.get("url").toString());
        }

        return registrationRepository.save(existing);
    }

    public void deleteRegistration(Long id) {
        registrationRepository.deleteById(id);
    }
}
