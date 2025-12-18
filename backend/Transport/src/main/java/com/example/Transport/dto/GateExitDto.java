package com.example.Transport.dto;



import java.util.List;

public class GateExitDto {
  public String actor;
  public Integer exitOdometer; // optional
  public List<Object> exitManifest; // any shape -> stored as JSON
}
