import Foundation

struct APIClient {
    private let networkService = NetworkService.shared
    
    // MARK: - Health
    func checkHealth() async throws -> HealthResponse {
        try await networkService.request(
            endpoint: "/health",
            requiresAuth: false
        )
    }
    
    // MARK: - Usage
    func importUsage(accountId: String, data: [UsageData]) async throws -> ImportResponse {
        let request = ImportUsageRequest(accountId: accountId, data: data)
        return try await networkService.request(
            endpoint: "/usage/import",
            method: .post,
            body: request
        )
    }
    
    // MARK: - Accounts
    func getAccounts() async throws -> [UtilityAccount] {
        try await networkService.request(endpoint: "/accounts")
    }
    
    // MARK: - Savings
    func getSavingsReports(accountId: String) async throws -> [SavingsReport] {
        try await networkService.request(endpoint: "/savings/report?accountId=\(accountId)")
    }
}

// MARK: - Request/Response Models
struct HealthResponse: Codable {
    let status: String
    let timestamp: String
    let database: String
}

struct ImportUsageRequest: Codable {
    let accountId: String
    let data: [UsageData]
}

struct ImportResponse: Codable {
    let success: Bool
    let imported: Int
}
