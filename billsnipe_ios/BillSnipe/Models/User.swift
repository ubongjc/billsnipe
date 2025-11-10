import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let role: String
    let createdAt: Date
    let updatedAt: Date
}

struct UtilityAccount: Codable, Identifiable {
    let id: String
    let userId: String
    let region: String
    let provider: String?
    let accountNumber: String?
    let status: String
    let createdAt: Date
    let updatedAt: Date
}

struct UsageData: Codable {
    let timestamp: Date
    let kWh: Double
}

struct SavingsReport: Codable, Identifiable {
    let id: String
    let accountId: String
    let month: Date
    let baseline: Double
    let actual: Double
    let savings: Double
    let verified: Bool
    let createdAt: Date
}
