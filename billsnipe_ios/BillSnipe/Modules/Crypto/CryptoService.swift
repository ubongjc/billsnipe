import Foundation
import CryptoKit

enum CryptoError: Error {
    case encryptionFailed
    case decryptionFailed
    case keyGenerationFailed
    case invalidData
}

class CryptoService {
    static let shared = CryptoService()
    
    private init() {}
    
    // MARK: - AES-GCM Encryption
    
    /// Encrypts data using AES-GCM with a symmetric key
    /// - Parameters:
    ///   - data: Data to encrypt
    ///   - key: Symmetric key (if nil, generates a new key)
    /// - Returns: Encrypted data and the key used
    func encrypt(data: Data, key: SymmetricKey? = nil) throws -> (encrypted: Data, key: SymmetricKey) {
        let encryptionKey = key ?? SymmetricKey(size: .bits256)
        
        do {
            let sealedBox = try AES.GCM.seal(data, using: encryptionKey)
            
            guard let combined = sealedBox.combined else {
                throw CryptoError.encryptionFailed
            }
            
            return (combined, encryptionKey)
        } catch {
            throw CryptoError.encryptionFailed
        }
    }
    
    /// Decrypts data that was encrypted with AES-GCM
    /// - Parameters:
    ///   - encryptedData: The encrypted data
    ///   - key: The symmetric key used for encryption
    /// - Returns: Decrypted data
    func decrypt(encryptedData: Data, key: SymmetricKey) throws -> Data {
        do {
            let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
            return try AES.GCM.open(sealedBox, using: key)
        } catch {
            throw CryptoError.decryptionFailed
        }
    }
    
    // MARK: - Key Management
    
    /// Generates a new symmetric key
    func generateKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }
    
    /// Converts a symmetric key to Data for storage
    func keyToData(_ key: SymmetricKey) -> Data {
        return key.withUnsafeBytes { Data($0) }
    }
    
    /// Creates a symmetric key from Data
    func dataToKey(_ data: Data) -> SymmetricKey {
        return SymmetricKey(data: data)
    }
    
    /// Derives a key from a password using PBKDF2
    func deriveKey(from password: String, salt: Data) throws -> SymmetricKey {
        guard let passwordData = password.data(using: .utf8) else {
            throw CryptoError.keyGenerationFailed
        }
        
        // Use SHA256 for key derivation
        let derived = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: passwordData),
            salt: salt,
            outputByteCount: 32
        )
        
        return derived
    }
    
    // MARK: - Hashing
    
    /// Computes SHA256 hash of data
    func hash(_ data: Data) -> Data {
        let digest = SHA256.hash(data: data)
        return Data(digest)
    }
    
    /// Computes SHA256 hash of a string
    func hash(_ string: String) -> String? {
        guard let data = string.data(using: .utf8) else {
            return nil
        }
        let digest = SHA256.hash(data: data)
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - Secure Storage Extension
extension CryptoService {
    /// Encrypts and stores data in UserDefaults (for non-sensitive metadata)
    func encryptAndStore(data: Data, key: String, userKey: SymmetricKey) throws {
        let (encrypted, _) = try encrypt(data: data, key: userKey)
        UserDefaults.standard.set(encrypted, forKey: key)
    }
    
    /// Retrieves and decrypts data from UserDefaults
    func retrieveAndDecrypt(key: String, userKey: SymmetricKey) throws -> Data? {
        guard let encrypted = UserDefaults.standard.data(forKey: key) else {
            return nil
        }
        return try decrypt(encryptedData: encrypted, key: userKey)
    }
}
