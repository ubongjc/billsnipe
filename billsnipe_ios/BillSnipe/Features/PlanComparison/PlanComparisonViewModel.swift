import Foundation
import Combine

@MainActor
class PlanComparisonViewModel: ObservableObject {
    @Published var accounts: [UtilityAccount] = []
    @Published var selectedAccountId: String?
    @Published var currentPlan: CurrentPlan?
    @Published var recommendations: [PlanRecommendation] = []
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient()
    
    func loadAccounts() async {
        do {
            accounts = try await apiClient.getAccounts()
            selectedAccountId = accounts.first?.id
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func comparePlans() async {
        guard let accountId = selectedAccountId,
              let account = accounts.first(where: { $0.id == accountId }) else {
            return
        }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            let response = try await apiClient.comparePlans(
                accountId: accountId,
                region: account.region
            )
            
            currentPlan = CurrentPlan(
                provider: response.currentPlan.provider ?? "Current Provider",
                estimatedMonthlyCost: response.currentPlan.estimatedMonthlyCost
            )
            recommendations = response.recommendations
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}

struct ComparisonResponse: Codable {
    let currentPlan: CurrentPlanResponse
    let recommendations: [PlanRecommendation]
}

struct CurrentPlanResponse: Codable {
    let provider: String?
    let estimatedMonthlyCost: Double
}
