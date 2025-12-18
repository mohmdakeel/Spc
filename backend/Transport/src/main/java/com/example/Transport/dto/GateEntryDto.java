package com.example.Transport.dto;


import java.util.List;

public class GateEntryDto {
  public String actor;
  public Integer entryOdometer; // required if exit present
  public List<Object> entryManifest; // any shape -> stored as JSON
}
