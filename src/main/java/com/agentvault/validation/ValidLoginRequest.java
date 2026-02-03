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
