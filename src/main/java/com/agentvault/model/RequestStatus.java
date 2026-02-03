package com.agentvault.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RequestStatus {
  pending("pending"),
  fulfilled("fulfilled"),
  rejected("rejected");

  private final String value;

  RequestStatus(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}