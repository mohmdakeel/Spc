package com.example.Authservice1.repository;

import com.example.Authservice1.model.User;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    @Query("""
           select u from User u
           where u.deleted=false and (
             lower(u.username) like concat('%', :q, '%') or
             lower(u.email) like concat('%', :q, '%') or
             lower(u.fullName) like concat('%', :q, '%')
           )
           """)
    Page<User> search(@Param("q") String q, Pageable pageable);

    @Query("select u from User u where u.deleted=false")
    Page<User> findAllActive(Pageable pageable);

    @Query("""
      select distinct u from User u
      left join u.roles r
      where u.deleted=false
        and (:q is null or :q = '' or
             lower(u.username) like concat('%', :q, '%') or
             lower(u.email) like concat('%', :q, '%') or
             lower(u.fullName) like concat('%', :q, '%'))
        and (:role is null or upper(r.name) = upper(:role))
        and (:from is null or u.createdAt >= :from)
        and (:to   is null or u.createdAt <  :to)
      order by u.createdAt desc, u.id desc
    """)
    List<User> exportFilter(
        @Param("q") String q,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        @Param("role") String role
    );
}
