package com.agentvault.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
  admin("admin"),
  agent("agent");

  private final String value;

  Role(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  public static Role fromString(String text) {
    for (Role b : Role.values()) {
      if (b.value.equalsIgnoreCase(text)) {
        return b;
      }
    }
    throw new IllegalArgumentException("No constant with text " + text + " found");
  }
}
