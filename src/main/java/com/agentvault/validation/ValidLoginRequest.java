/*
 * Copyright 2026 Tsung-en Hsiao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.agentvault.validation;

import com.agentvault.dto.LoginRequest;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.util.StringUtils;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidLoginRequest.LoginRequestValidator.class)
public @interface ValidLoginRequest {
  String message() default "Either username/password or appToken must be provided";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  class LoginRequestValidator implements ConstraintValidator<ValidLoginRequest, LoginRequest> {

    @Override
    public boolean isValid(LoginRequest request, ConstraintValidatorContext context) {
      if (request == null) {
        return true; // @NotNull on the object itself should handle this
      }

      boolean adminLoginPresent =
          StringUtils.hasText(request.username()) && StringUtils.hasText(request.password());
      boolean agentLoginPresent = StringUtils.hasText(request.appToken());

      // XOR: One and only one must be present
      return adminLoginPresent ^ agentLoginPresent;
    }
  }
}
