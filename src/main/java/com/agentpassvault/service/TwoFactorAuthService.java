/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.util.Utils;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorAuthService {

  private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
  private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
  private final CodeVerifier codeVerifier;

  public TwoFactorAuthService() {
    TimeProvider timeProvider = new SystemTimeProvider();
    CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
    this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
  }

  public String generateSecret() {
    return secretGenerator.generate();
  }

  public String generateQrCodeUrl(String secret, String accountName) {
    QrData data =
        new QrData.Builder()
            .label(accountName)
            .secret(secret)
            .issuer("AgentPassVault")
            .algorithm(HashingAlgorithm.SHA1)
            .digits(6)
            .period(30)
            .build();

    try {
      byte[] imageData = qrGenerator.generate(data);
      return Utils.getDataUriForImage(imageData, qrGenerator.getImageMimeType());
    } catch (QrGenerationException e) {
      throw new RuntimeException("Failed to generate QR code", e);
    }
  }

  public boolean verifyCode(String secret, String code) {
    return codeVerifier.isValidCode(secret, code);
  }
}
