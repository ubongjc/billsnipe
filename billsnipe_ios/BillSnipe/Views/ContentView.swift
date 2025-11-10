import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        Group {
            if authService.isAuthenticated {
                MainTabView()
            } else {
                SignInView()
            }
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.bar.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}
