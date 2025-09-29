package com.example.Authservice1.repository;

import com.example.Authservice1.model.Registration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.*;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    Optional<Registration> findByIdAndDeletedFalse(Long id);
    Optional<Registration> findByEpfNo(String epfNo);
    boolean existsByEpfNo(String epfNo);
    List<Registration> findByDeletedFalse();

    @Query("""
           select r from Registration r
           where r.deleted=false and (
             lower(r.epfNo) like concat('%', :q, '%') or
             lower(r.fullName) like concat('%', :q, '%') or
             lower(r.nicNo) like concat('%', :q, '%') or
             lower(r.district) like concat('%', :q, '%')
           )
           """)
    Page<Registration> search(@Param("q") String q, Pageable pageable);

    Page<Registration> findAllByDeletedFalse(Pageable pageable);

    @Query("""
      select r from Registration r
      where r.deleted=false
        and (:q is null or :q = '' or
             lower(r.epfNo) like concat('%', :q, '%') or
             lower(r.fullName) like concat('%', :q, '%') or
             lower(r.nicNo) like concat('%', :q, '%') or
             lower(r.district) like concat('%', :q, '%'))
        and (:department is null or lower(r.department) = lower(:department))
        and (:from is null or r.addedTime >= :from)
        and (:to   is null or r.addedTime <  :to)
      order by r.addedTime desc, r.id desc
    """)
    List<Registration> exportFilter(
        @Param("q") String q,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("department") String department
    );
}
