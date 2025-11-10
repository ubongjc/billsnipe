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
        let response: AccountsResponse = try await networkService.request(endpoint: "/accounts")
        return response.accounts
    }

    func createAccount(region: String, provider: String?, accountNumber: String?) async throws -> UtilityAccount {
        let request = CreateAccountRequest(region: region, provider: provider, accountNumber: accountNumber)
        let response: CreateAccountResponse = try await networkService.request(
            endpoint: "/accounts",
            method: .post,
            body: request
        )
        return response.account
    }

    // MARK: - Savings
    func getSavingsReports(accountId: String) async throws -> [SavingsReport] {
        try await networkService.request(endpoint: "/savings/report?accountId=\(accountId)")
    }

    // MARK: - Plan Comparison
    func comparePlans(accountId: String, region: String) async throws -> ComparisonResponse {
        let request = ComparePlansRequest(accountId: accountId, region: region)
        return try await networkService.request(
            endpoint: "/plan/compare",
            method: .post,
            body: request
        )
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

struct AccountsResponse: Codable {
    let accounts: [UtilityAccount]
}

struct CreateAccountRequest: Codable {
    let region: String
    let provider: String?
    let accountNumber: String?
}

struct CreateAccountResponse: Codable {
    let success: Bool
    let account: UtilityAccount
}

struct ComparePlansRequest: Codable {
    let accountId: String
    let region: String
}
