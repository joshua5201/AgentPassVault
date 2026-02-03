package com.agentvault.service.crypto;

/**
 * Interface for providing the System Master Key (SMK).
 * This allows for different implementations such as Environment Variables,
 * AWS KMS, Google Cloud KMS, or HashiCorp Vault.
 */
public interface MasterKeyProvider {

    /**
     * Retrieves the System Master Key.
     * @return The master key as a byte array.
     */
    byte[] getMasterKey();
}
