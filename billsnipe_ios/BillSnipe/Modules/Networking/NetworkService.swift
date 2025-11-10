import Foundation

enum NetworkError: Error {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case decodingFailed(Error)
    case unauthorized
    case serverError(Int)
}

class NetworkService {
    static let shared = NetworkService()
    
    private let baseURL: String
    private let session: URLSession
    
    private init() {
        // In production, this should come from configuration
        self.baseURL = "http://localhost:3000/api"
        
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: configuration)
    }
    
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication token if required
        if requiresAuth, let token = KeychainHelper.shared.getToken() {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if provided
        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw NetworkError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                return try decoder.decode(T.self, from: data)
                
            case 401:
                throw NetworkError.unauthorized
                
            default:
                throw NetworkError.serverError(httpResponse.statusCode)
            }
            
        } catch let error as DecodingError {
            throw NetworkError.decodingFailed(error)
        } catch let error as NetworkError {
            throw error
        } catch {
            throw NetworkError.requestFailed(error)
        }
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}
