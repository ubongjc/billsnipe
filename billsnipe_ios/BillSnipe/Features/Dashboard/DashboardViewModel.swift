import Foundation
import Combine

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var currentAccount: UtilityAccount?
    @Published var recentReports: [SavingsReport] = []
    @Published var totalSavings: Double?
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private let apiClient = APIClient()
    
    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            // Fetch accounts
            let accounts = try await apiClient.getAccounts()
            self.currentAccount = accounts.first
            
            // Fetch savings reports if we have an account
            if let accountId = currentAccount?.id {
                let reports = try await apiClient.getSavingsReports(accountId: accountId)
                self.recentReports = reports.sorted { $0.month > $1.month }.prefix(5).map { $0 }
                self.totalSavings = reports.reduce(0) { $0 + $1.savings }
            }
            
        } catch {
            self.errorMessage = error.localizedDescription
            self.showError = true
        }
    }
    
    func refresh() async {
        await loadData()
    }
}
