package com.example.Transport.repository;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class UsageRequestAvailabilityRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<UsageRow> findActive() {
        String sql = """
                SELECT id,
                       request_code,
                       status,
                       assigned_driver_id,
                       assigned_driver_name,
                       assigned_driver_phone,
                       assigned_vehicle_id,
                       assigned_vehicle_number,
                       scheduled_pickup_at,
                       scheduled_return_at,
                       date_of_travel,
                       time_from,
                       time_to
                FROM usage_requests
                WHERE status IN ('APPROVED','SCHEDULED','DISPATCHED')
                """;
        return jdbcTemplate.query(sql, new UsageRowMapper());
    }

    @Data
    @Builder
    public static class UsageRow {
        private Long id;
        private String requestCode;
        private String status;
        private Long driverId;
        private String driverName;
        private String driverPhone;
        private Long vehicleId;
        private String vehicleNumber;
        private LocalDateTime scheduledPickupAt;
        private LocalDateTime scheduledReturnAt;
        private LocalDate dateOfTravel;
        private String timeFrom;
        private String timeTo;
    }

    private static class UsageRowMapper implements RowMapper<UsageRow> {
        @Override
        public UsageRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            LocalDate date = rs.getDate("date_of_travel") != null
                    ? rs.getDate("date_of_travel").toLocalDate()
                    : null;
            LocalDateTime pickup = rs.getTimestamp("scheduled_pickup_at") != null
                    ? rs.getTimestamp("scheduled_pickup_at").toLocalDateTime()
                    : null;
            LocalDateTime ret = rs.getTimestamp("scheduled_return_at") != null
                    ? rs.getTimestamp("scheduled_return_at").toLocalDateTime()
                    : null;
            return UsageRow.builder()
                    .id(rs.getLong("id"))
                    .requestCode(rs.getString("request_code"))
                    .status(rs.getString("status"))
                    .driverId(getLongOrNull(rs, "assigned_driver_id"))
                    .driverName(rs.getString("assigned_driver_name"))
                    .driverPhone(rs.getString("assigned_driver_phone"))
                    .vehicleId(getLongOrNull(rs, "assigned_vehicle_id"))
                    .vehicleNumber(rs.getString("assigned_vehicle_number"))
                    .scheduledPickupAt(pickup)
                    .scheduledReturnAt(ret)
                    .dateOfTravel(date)
                    .timeFrom(rs.getString("time_from"))
                    .timeTo(rs.getString("time_to"))
                    .build();
        }

        private Long getLongOrNull(ResultSet rs, String col) throws SQLException {
            long v = rs.getLong(col);
            return rs.wasNull() ? null : v;
        }
    }
}
