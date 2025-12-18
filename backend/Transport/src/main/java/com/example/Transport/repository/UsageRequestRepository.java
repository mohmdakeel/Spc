package com.example.Transport.repository;

import com.example.Transport.enums.RequestStatus;
import com.example.Transport.entity.UsageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface UsageRequestRepository extends JpaRepository<UsageRequest, Long> {

  /* ---- Paged finders ---- */
  Page<UsageRequest> findAll(Pageable pageable);
  Page<UsageRequest> findAllByStatus(RequestStatus status, Pageable pageable);

  /* Applicant (my requests) */
  Page<UsageRequest> findByEmployeeIdOrderByCreatedAtDesc(String employeeId, Pageable pageable);

  /* HOD lists by department + status */
  Page<UsageRequest> findByDepartmentAndStatusOrderByCreatedAtDesc(String department, RequestStatus status, Pageable pageable);

  /* Existing convenience (non-paged) used elsewhere */
  List<UsageRequest> findAllByStatusOrderByCreatedAtDesc(RequestStatus status);

  /* Overlap checks used by assign() */
  @Query("""
    select case when count(u) > 0 then true else false end
    from UsageRequest u
    where (:excludeId is null or u.id <> :excludeId)
      and u.status in :activeStatuses
      and u.assignedVehicleId = :vehicleId
      and u.scheduledPickupAt < :windowEnd
      and u.scheduledReturnAt > :windowStart
  """)
  boolean existsVehicleOverlap(@Param("vehicleId") Long vehicleId,
                               @Param("windowStart") LocalDateTime windowStart,
                               @Param("windowEnd") LocalDateTime windowEnd,
                               @Param("excludeId") Long excludeId,
                               @Param("activeStatuses") Collection<RequestStatus> activeStatuses);

  @Query("""
    select case when count(u) > 0 then true else false end
    from UsageRequest u
    where (:excludeId is null or u.id <> :excludeId)
      and u.status in :activeStatuses
      and u.assignedDriverId = :driverId
      and u.scheduledPickupAt < :windowEnd
      and u.scheduledReturnAt > :windowStart
  """)
  boolean existsDriverOverlap(@Param("driverId") Long driverId,
                              @Param("windowStart") LocalDateTime windowStart,
                              @Param("windowEnd") LocalDateTime windowEnd,
                              @Param("excludeId") Long excludeId,
                              @Param("activeStatuses") Collection<RequestStatus> activeStatuses);

  /* For metrics() next-day list */
  @Query("""
    select u from UsageRequest u
    where u.status in :statuses
    order by u.scheduledPickupAt asc nulls last
  """)
  List<UsageRequest> findAllByStatusesOrderByPickup(@Param("statuses") List<RequestStatus> statuses);

  /* Gate / today’s schedule window */
  @Query("""
    select u from UsageRequest u
    where u.status in :statuses
      and u.scheduledPickupAt is not null
      and u.scheduledPickupAt between :start and :end
    order by u.scheduledPickupAt asc
  """)
  List<UsageRequest> findScheduledBetween(@Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end,
                                          @Param("statuses") List<RequestStatus> statuses);
}
