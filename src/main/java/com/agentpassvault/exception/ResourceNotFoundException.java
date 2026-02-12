/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.exception;

public class ResourceNotFoundException extends RuntimeException {
  public ResourceNotFoundException(String message) {
    super(message);
  }
}
