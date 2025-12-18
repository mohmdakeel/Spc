package com.example.Transport.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonUtil {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  public static String toJson(Object obj) {
    if (obj == null) return null;
    try {
      return MAPPER.writeValueAsString(obj);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }
}
