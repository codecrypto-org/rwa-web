# 📐 Diagramas C4 - Plataforma RWA

Diagramas de arquitectura siguiendo el modelo C4 (Context, Containers, Components, Code)

---

## 📊 Nivel 1: Diagrama de Contexto (System Context)

Muestra el sistema RWA y sus usuarios/sistemas externos.

```mermaid
graph TB
    subgraph "Usuarios"
        Investor[👤 Investor<br/>Compra tokens RWA]
        Admin[👨‍💼 Token Admin<br/>Crea y gestiona tokens]
        Issuer[🏛️ Trusted Issuer<br/>Certifica identidades]
    end
    
    subgraph "Sistema RWA Platform"
        System[🏗️ RWA Platform<br/>Sistema de tokenización de activos<br/>con compliance automatizado]
    end
    
    subgraph "Sistemas Externos"
        Blockchain[⛓️ Ethereum Blockchain<br/>Anvil Local Network<br/>Chain ID: 31337]
        MongoDB[💾 MongoDB<br/>Base de datos rwa<br/>localhost:27017]
        MetaMask[🦊 MetaMask<br/>Wallet Provider<br/>Web3 Interface]
    end
    
    Investor -->|Solicita claims<br/>Compra tokens| System
    Admin -->|Crea tokens<br/>Gestiona compliance| System
    Issuer -->|Aprueba claims<br/>Firma certificaciones| System
    
    System -->|Deploy contratos<br/>Ejecuta transacciones| Blockchain
    System -->|Guarda datos<br/>Almacena documentos| MongoDB
    System <-->|Firma transacciones<br/>Conecta wallet| MetaMask
    
    style System fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Blockchain fill:#627EEA,stroke:#454A75,color:#fff
    style MongoDB fill:#13AA52,stroke:#0D7A3A,color:#fff
    style MetaMask fill:#F6851B,stroke:#C66A13,color:#fff
```

---

## 🏗️ Nivel 2: Diagrama de Contenedores (Container Diagram)

Muestra las aplicaciones que componen el sistema RWA.

```mermaid
graph TB
    subgraph "Users"
        User[👤 Usuario<br/>Browser + MetaMask]
    end
    
    subgraph "RWA Platform Applications"
        subgraph "Port 4001"
            Identity[🆔 web-identity<br/>Next.js App<br/>Identity Management]
        end
        
        subgraph "Port 4002"
            Registry[🏛️ web-registry-trusted<br/>Next.js App<br/>Issuer Panel]
        end
        
        subgraph "Port 4003"
            Token[🏭 web-token<br/>Next.js App<br/>Token Factory & Marketplace]
        end
    end
    
    subgraph "Infrastructure"
        Anvil[⛓️ Anvil<br/>Local Ethereum<br/>Port 8545]
        Mongo[(💾 MongoDB<br/>Database: rwa<br/>Port 27017)]
    end
    
    subgraph "Smart Contracts On-Chain"
        IdentityReg[📝 Identity Registry]
        TrustedReg[🏛️ Trusted Issuers Registry]
        TokenFactory[🏭 Token Clone Factory]
        IdentityContract[🆔 Identity Contract]
        TokenContract[💎 Token Contract]
    end
    
    User -->|HTTP| Identity
    User -->|HTTP| Registry
    User -->|HTTP| Token
    
    Identity -->|API Calls| Mongo
    Registry -->|API Calls| Mongo
    Token -->|API Calls| Mongo
    
    Identity -->|Web3 RPC| Anvil
    Registry -->|Web3 RPC| Anvil
    Token -->|Web3 RPC| Anvil
    
    Anvil -.->|Contains| IdentityReg
    Anvil -.->|Contains| TrustedReg
    Anvil -.->|Contains| TokenFactory
    Anvil -.->|Contains| IdentityContract
    Anvil -.->|Contains| TokenContract
    
    Identity -->|Deploy/Query| IdentityReg
    Identity -->|Add Claims| IdentityContract
    
    Registry -->|Query Issuers| TrustedReg
    
    Token -->|Create Tokens| TokenFactory
    Token -->|Transfer/Mint| TokenContract
    
    style Identity fill:#4A90E2,stroke:#2E5C8A,color:#fff
    style Registry fill:#7B68EE,stroke:#5A4DB8,color:#fff
    style Token fill:#50C878,stroke:#3A9B5C,color:#fff
    style Anvil fill:#627EEA,stroke:#454A75,color:#fff
    style Mongo fill:#13AA52,stroke:#0D7A3A,color:#fff
```

---

## 🔧 Nivel 3: Diagrama de Componentes (Component Diagram)

### web-identity (Port 4001)

```mermaid
graph TB
    subgraph "web-identity Application"
        subgraph "Pages"
            IndexPage[📄 page.tsx<br/>Main Dashboard]
        end
        
        subgraph "Components"
            ClaimRequestForm[📝 ClaimRequestForm<br/>Solicitar claims]
            ClaimRequestsList[📋 ClaimRequestsList<br/>Ver mis requests]
            RequestDetailModal[🔍 RequestDetailModal<br/>Ver detalles + Cargar claim]
        end
        
        subgraph "API Routes"
            ClaimRequestsAPI[🔌 /api/claim-requests<br/>CRUD requests]
            UploadAPI[📤 /api/upload<br/>Subir a GridFS]
            DownloadAPI[📥 /api/download/[id]<br/>Descargar de GridFS]
        end
        
        subgraph "Libraries"
            MongoLib[💾 lib/mongodb.ts<br/>Conexión MongoDB]
            ContractsLib[📜 lib/contracts.ts<br/>ABIs y addresses]
            ClaimsLib[⚖️ lib/identity-claims.ts<br/>Funciones de claims]
        end
        
        subgraph "External"
            MongoDB[(MongoDB<br/>claim_requests<br/>GridFS)]
            Blockchain[⛓️ Blockchain<br/>Identity Contracts]
        end
    end
    
    IndexPage --> ClaimRequestForm
    IndexPage --> ClaimRequestsList
    
    ClaimRequestForm -->|Submit request| ClaimRequestsAPI
    ClaimRequestForm -->|Upload file| UploadAPI
    ClaimRequestForm -->|Sign message| ContractsLib
    
    ClaimRequestsList -->|Fetch requests| ClaimRequestsAPI
    ClaimRequestsList -->|Open modal| RequestDetailModal
    
    RequestDetailModal -->|Download file| DownloadAPI
    RequestDetailModal -->|Add claim| ClaimsLib
    
    ClaimRequestsAPI --> MongoLib
    UploadAPI --> MongoLib
    DownloadAPI --> MongoLib
    
    MongoLib --> MongoDB
    ClaimsLib --> Blockchain
    ContractsLib --> Blockchain
    
    style IndexPage fill:#4A90E2,color:#fff
    style ClaimRequestForm fill:#5DADE2,color:#fff
    style ClaimRequestsList fill:#5DADE2,color:#fff
    style RequestDetailModal fill:#5DADE2,color:#fff
```

### web-registry-trusted (Port 4002)

```mermaid
graph TB
    subgraph "web-registry-trusted Application"
        subgraph "Pages"
            RegistryPage[📄 page.tsx<br/>Registry Dashboard + Issuer Panel]
        end
        
        subgraph "Components"
            IssuerRequestsList[📋 IssuerRequestsList<br/>Ver pending requests]
            RequestDetailModal2[🔍 RequestDetailModal<br/>Aprobar/Rechazar + Firma]
        end
        
        subgraph "API Routes"
            IssuerRequestsAPI[🔌 /api/issuer-requests<br/>Get requests for issuer]
            UpdateRequestAPI[✅ /api/update-request<br/>Approve/Reject + Signature]
            DownloadAPI2[📥 /api/download/[id]<br/>Descargar documentos]
        end
        
        subgraph "Libraries"
            MongoLib2[💾 lib/mongodb.ts<br/>Conexión MongoDB]
            ContractsLib2[📜 contracts/TrustedIssuersRegistry.ts<br/>ABI y funciones]
        end
        
        subgraph "External"
            MongoDB2[(MongoDB<br/>claim_requests)]
            Blockchain2[⛓️ Blockchain<br/>Trusted Issuers Registry]
        end
    end
    
    RegistryPage -->|Query issuers| ContractsLib2
    RegistryPage -->|If is issuer| IssuerRequestsList
    
    IssuerRequestsList -->|Fetch requests| IssuerRequestsAPI
    IssuerRequestsList -->|Open modal| RequestDetailModal2
    
    RequestDetailModal2 -->|Download doc| DownloadAPI2
    RequestDetailModal2 -->|Sign decision| ContractsLib2
    RequestDetailModal2 -->|Update status| UpdateRequestAPI
    
    IssuerRequestsAPI --> MongoLib2
    UpdateRequestAPI --> MongoLib2
    DownloadAPI2 --> MongoLib2
    
    MongoLib2 --> MongoDB2
    ContractsLib2 --> Blockchain2
    
    style RegistryPage fill:#7B68EE,color:#fff
    style IssuerRequestsList fill:#9370DB,color:#fff
    style RequestDetailModal2 fill:#9370DB,color:#fff
```

### web-token (Port 4003)

```mermaid
graph TB
    subgraph "web-token Application"
        subgraph "Pages"
            FactoryPage[📄 page.tsx<br/>Token Factory]
            MarketplacePage[🏪 marketplace/page.tsx<br/>Buy & Transfer]
        end
        
        subgraph "Components"
            CreateTokenForm[📝 CreateTokenForm<br/>Crear tokens]
            TokensList[📋 TokensList<br/>Ver y gestionar tokens]
        end
        
        subgraph "API Routes"
            TokensAPI[🔌 /api/tokens<br/>CRUD tokens]
            PriceAPI[💰 /api/tokens/[id]/price<br/>Update price]
            ModulesAPI[📦 /api/tokens/[id]/modules<br/>Manage compliance]
            ClaimsAPI[🏷️ /api/tokens/[id]/claims<br/>Manage claims]
        end
        
        subgraph "Libraries"
            MongoLib3[💾 lib/mongodb.ts]
            FactoryLib[🏭 lib/contracts/TokenCloneFactory.ts]
            CloneableLib[💎 lib/contracts/TokenCloneable.ts]
            ComplianceLib[🔒 lib/contracts/compliance.ts]
        end
        
        subgraph "External"
            MongoDB3[(MongoDB<br/>tokens)]
            Blockchain3[⛓️ Blockchain<br/>Token Contracts]
        end
    end
    
    FactoryPage --> CreateTokenForm
    FactoryPage --> TokensList
    
    MarketplacePage --> TokensList
    
    CreateTokenForm -->|Create token| TokensAPI
    CreateTokenForm -->|Deploy clone| FactoryLib
    
    TokensList -->|Update price| PriceAPI
    TokensList -->|Add/hide modules| ModulesAPI
    TokensList -->|Remove claims| ClaimsAPI
    TokensList -->|Buy/Transfer| CloneableLib
    
    TokensAPI --> MongoLib3
    PriceAPI --> MongoLib3
    ModulesAPI --> MongoLib3
    ClaimsAPI --> MongoLib3
    
    MongoLib3 --> MongoDB3
    FactoryLib --> Blockchain3
    CloneableLib --> Blockchain3
    ComplianceLib --> Blockchain3
    
    style FactoryPage fill:#50C878,color:#fff
    style MarketplacePage fill:#3CB371,color:#fff
    style CreateTokenForm fill:#90EE90,color:#000
    style TokensList fill:#90EE90,color:#000
```

---

## 🔄 Nivel 4: Diagrama de Flujo de Datos (Data Flow)

### Flujo Completo: Investor Compra Token

```mermaid
sequenceDiagram
    participant I as 👤 Investor
    participant W as 🦊 MetaMask
    participant IA as 🆔 Identity App
    participant RA as 🏛️ Registry App
    participant TA as 🏭 Token App
    participant MA as 🏪 Marketplace
    participant M as 💾 MongoDB
    participant B as ⛓️ Blockchain
    
    Note over I,B: Paso 1: Crear Identidad
    I->>IA: Conectar wallet
    IA->>W: Request accounts
    W-->>IA: Account address
    I->>IA: Deploy Identity
    IA->>W: Sign transaction
    W->>B: deployIdentity(user)
    B-->>IA: Identity address
    
    Note over I,B: Paso 2: Solicitar Claims
    I->>IA: Request KYC claim
    IA->>W: Sign message (requester + date)
    W-->>IA: Signature
    IA->>M: Save claim_request + signature
    M-->>IA: Request saved
    
    Note over I,B: Paso 3: Issuer Aprueba
    I->>RA: Connect as Issuer
    RA->>M: Get pending requests
    M-->>RA: List of requests
    I->>RA: Approve request
    RA->>W: Sign decision
    W-->>RA: Issuer signature
    RA->>M: Update request + issuer signature
    M-->>RA: Updated
    
    Note over I,B: Paso 4: Cargar Claim al Contrato
    I->>IA: Load approved claim
    IA->>W: Sign addClaim transaction
    W->>B: identity.addClaim(topic, issuer, signature, data)
    B-->>IA: Claim added on-chain
    
    Note over I,B: Paso 5: Admin Crea Token
    I->>TA: Create token (as admin)
    TA->>W: Sign transaction
    W->>B: factory.createToken(name, symbol, decimals)
    B-->>TA: Token address
    TA->>M: Save token metadata
    TA->>M: Set price: 0.5 ETH
    M-->>TA: Saved
    
    Note over I,B: Paso 6: Investor Compra Token
    I->>MA: View tokens
    MA->>M: Get all tokens
    M-->>MA: Tokens list
    I->>MA: Buy 10 tokens
    MA->>W: Sign transfer
    W->>B: token.transfer(investor, 10)
    B->>B: Check compliance (investor has claims?)
    B-->>MA: ✅ Transfer successful
    MA-->>I: 10 tokens received
```

---

## 🔗 Diagrama de Integración de Smart Contracts

```mermaid
graph TB
    subgraph "Smart Contracts Ecosystem"
        subgraph "Registries (Shared)"
            IR[Identity Registry<br/>📝 Deploy identities]
            TR[Trusted Issuers Registry<br/>🏛️ Manage issuers]
            CTR[Claim Topics Registry<br/>🏷️ Define topics]
        end
        
        subgraph "Factory (Token Creation)"
            TF[Token Clone Factory<br/>🏭 EIP-1167<br/>Gas: ~50k]
            IMPL[Token Implementation<br/>💎 Logic contract<br/>Gas: ~3M one-time]
        end
        
        subgraph "Per-User Instances"
            ID1[Identity #1<br/>🆔 User A]
            ID2[Identity #2<br/>🆔 User B]
            IDN[Identity #N<br/>🆔 User N]
        end
        
        subgraph "Per-Token Instances"
            T1[Token #1<br/>💎 RET]
            T2[Token #2<br/>💎 EST]
            TN[Token #N<br/>💎 XXX]
        end
        
        subgraph "Compliance Modules"
            CM1[Compliance Module<br/>🔒 Module 1]
            CM2[Compliance Module<br/>🔒 Module 2]
        end
    end
    
    IR -->|deployIdentity| ID1
    IR -->|deployIdentity| ID2
    IR -->|deployIdentity| IDN
    
    TF -->|createToken<br/>delegatecall| IMPL
    TF -->|clone| T1
    TF -->|clone| T2
    TF -->|clone| TN
    
    T1 -->|addComplianceModule| CM1
    T1 -->|addComplianceModule| CM2
    T2 -->|addComplianceModule| CM1
    
    ID1 -->|addClaim| TR
    T1 -->|canTransfer?| ID1
    T1 -->|verify claims| TR
    T1 -->|check compliance| CM1
    
    style IR fill:#4A90E2,color:#fff
    style TR fill:#7B68EE,color:#fff
    style TF fill:#50C878,color:#fff
    style IMPL fill:#3CB371,color:#fff
    style CM1 fill:#FFD700,color:#000
    style CM2 fill:#FFD700,color:#000
```

---

## 📦 Diagrama de Componentes - MongoDB Collections

```mermaid
graph LR
    subgraph "MongoDB Database: rwa"
        subgraph "Collections"
            CR[claim_requests<br/>📝 Solicitudes de claims]
            TOK[tokens<br/>💎 Tokens RWA]
        end
        
        subgraph "GridFS Buckets"
            GFS[claim_documents.files<br/>📄 Metadata]
            GFC[claim_documents.chunks<br/>🗂️ Binary chunks]
        end
        
        subgraph "Indexes"
            IDX1[requesterAddress<br/>issuerAddress<br/>status]
            IDX2[tokenAddress<br/>adminAddress]
        end
    end
    
    CR -->|References| GFS
    GFS --> GFC
    CR -.->|Indexed by| IDX1
    TOK -.->|Indexed by| IDX2
    
    style CR fill:#E8F4F8,stroke:#4A90E2
    style TOK fill:#F0E68C,stroke:#FFD700
    style GFS fill:#98FB98,stroke:#50C878
    style GFC fill:#90EE90,stroke:#3CB371
```

---

## 🔄 Diagrama de Estados: Claim Request Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Investor creates request
    
    Created --> Pending: Saved in MongoDB
    
    Pending --> Approved: Issuer approves + signs
    Pending --> Rejected: Issuer rejects + signs
    
    Approved --> LoadedOnChain: Investor loads to identity contract
    
    Rejected --> [*]: Cannot be loaded
    LoadedOnChain --> [*]: Claim active on-chain
    
    note right of Created
        - Requester signature
        - Document uploaded (GridFS)
        - Timestamp recorded
    end note
    
    note right of Approved
        - Issuer signature
        - Review note
        - Reviewed timestamp
    end note
    
    note right of LoadedOnChain
        - On-chain claim
        - Immutable
        - Used for compliance
    end note
```

---

## 🛒 Diagrama de Flujo: Compra de Token

```mermaid
flowchart TD
    Start([👤 Investor ve Marketplace]) --> Connect{¿Wallet<br/>conectada?}
    
    Connect -->|No| ConnectWallet[🔗 Connect Wallet]
    ConnectWallet --> MetaMask1[🦊 MetaMask<br/>Solicita conexión]
    MetaMask1 --> Connected[✅ Conectado]
    
    Connect -->|Sí| Connected
    
    Connected --> ViewTokens[📋 Ver lista de tokens]
    ViewTokens --> SelectToken[💎 Seleccionar token]
    SelectToken --> CheckPrice{¿Precio<br/>establecido?}
    
    CheckPrice -->|No| ErrorNoPrice[❌ Error: Price not set]
    ErrorNoPrice --> End1([Fin])
    
    CheckPrice -->|Sí| ClickBuy[💰 Click Buy Tokens]
    ClickBuy --> EnterAmount[📝 Ingresar cantidad]
    EnterAmount --> Calculate[🧮 Calcular: cantidad × precio]
    Calculate --> SignTx[🦊 Firmar en MetaMask]
    
    SignTx --> EstimateGas[⛽ Estimar gas]
    EstimateGas --> ComplianceCheck{Compliance<br/>Check}
    
    ComplianceCheck -->|❌ No cumple| ErrorCompliance[🚫 Transfer not compliant]
    ErrorCompliance --> ShowRequirements[📋 Mostrar claims requeridos]
    ShowRequirements --> ShowGuide[💡 Guía: Ir a Identity app]
    ShowGuide --> End2([Fin])
    
    ComplianceCheck -->|✅ Cumple| ExecuteTx[⛓️ Ejecutar transfer()]
    ExecuteTx --> WaitConfirm[⏳ Esperar confirmación]
    WaitConfirm --> Success[✅ Tokens recibidos]
    Success --> ShowHash[📜 Mostrar hash]
    ShowHash --> End3([✅ Compra exitosa])
    
    style Start fill:#4A90E2,color:#fff
    style Success fill:#50C878,color:#fff
    style ErrorCompliance fill:#E74C3C,color:#fff
    style ErrorNoPrice fill:#E74C3C,color:#fff
```

---

## 🏗️ Arquitectura de Despliegue

```mermaid
graph TB
    subgraph "Development Environment"
        subgraph "Local Machine"
            subgraph "Ports"
                P4001[":4001<br/>web-identity"]
                P4002[":4002<br/>web-registry-trusted"]
                P4003[":4003<br/>web-token"]
                P8545[":8545<br/>Anvil RPC"]
                P27017[":27017<br/>MongoDB"]
            end
            
            subgraph "Processes"
                NI[Node.js<br/>Identity]
                NR[Node.js<br/>Registry]
                NT[Node.js<br/>Token]
                AN[Anvil<br/>Ethereum Node]
                MG[mongod<br/>Database Server]
            end
            
            subgraph "Storage"
                FS1[logs/<br/>App logs]
                FS2[.pids/<br/>Process IDs]
                DB[(MongoDB Data<br/>/data/db)]
            end
        end
        
        subgraph "Browser"
            MM[MetaMask<br/>Extension]
            TAB1[Tab 1: Identity]
            TAB2[Tab 2: Registry]
            TAB3[Tab 3: Token]
        end
    end
    
    NI --> P4001
    NR --> P4002
    NT --> P4003
    AN --> P8545
    MG --> P27017
    
    NI & NR & NT --> FS1
    NI & NR & NT -.->|PID| FS2
    MG --> DB
    
    TAB1 -->|HTTP| P4001
    TAB2 -->|HTTP| P4002
    TAB3 -->|HTTP| P4003
    
    TAB1 & TAB2 & TAB3 -->|Web3| MM
    MM -->|RPC| P8545
    
    P4001 & P4002 & P4003 -->|RPC| P8545
    P4001 & P4002 & P4003 -->|Query/Insert| P27017
    
    style MM fill:#F6851B,color:#fff
    style AN fill:#627EEA,color:#fff
    style MG fill:#13AA52,color:#fff
```

---

## 🔐 Diagrama de Seguridad: Sistema de Firmas

```mermaid
sequenceDiagram
    participant User as 👤 Requester
    participant App as 🆔 Identity App
    participant MM as 🦊 MetaMask
    participant DB as 💾 MongoDB
    participant Issuer as 🏛️ Issuer
    participant RA as 🏛️ Registry App
    participant BC as ⛓️ Blockchain
    
    rect rgb(200, 220, 240)
        Note over User,DB: Firma Digital del Requester
        User->>App: Request claim
        App->>App: Create message<br/>(address + timestamp)
        App->>MM: Sign message
        MM->>MM: Private key signs
        MM-->>App: Signature
        App->>DB: Save request + signature
        DB-->>App: Saved ✅
    end
    
    rect rgb(220, 200, 240)
        Note over Issuer,BC: Firma Digital del Issuer
        Issuer->>RA: View request
        RA->>DB: Get request + requester signature
        DB-->>RA: Request data
        RA->>RA: Verify requester signature ✅
        Issuer->>RA: Approve request
        RA->>RA: Create decision message<br/>(requestId + issuer + decision + timestamp)
        RA->>MM: Sign decision
        MM->>MM: Private key signs
        MM-->>RA: Issuer signature
        RA->>DB: Update request + issuer signature
        DB-->>RA: Updated ✅
    end
    
    rect rgb(200, 240, 200)
        Note over User,BC: Cargar Claim On-Chain
        User->>App: Load approved claim
        App->>DB: Get issuer signature
        DB-->>App: Signature
        App->>MM: Sign addClaim transaction
        MM->>BC: identity.addClaim(<br/>topic, issuer, signature, data)
        BC->>BC: Verify issuer signature ✅
        BC-->>App: Claim added ✅
    end
```

---

## 📊 Diagrama Entidad-Relación (MongoDB)

```mermaid
erDiagram
    CLAIM_REQUESTS ||--o{ GRIDFS_FILES : "has attachment"
    CLAIM_REQUESTS {
        ObjectId _id PK
        string requesterAddress
        string issuerAddress
        int claimTopic
        string message
        ObjectId documentFileId FK
        string signedMessage
        string signature
        string status
        string issuerSignedMessage
        string issuerSignature
        date createdAt
        date updatedAt
    }
    
    GRIDFS_FILES ||--|{ GRIDFS_CHUNKS : "stored in"
    GRIDFS_FILES {
        ObjectId _id PK
        string filename
        string contentType
        int length
        date uploadDate
    }
    
    GRIDFS_CHUNKS {
        ObjectId files_id FK
        int n
        binary data
    }
    
    TOKENS {
        ObjectId _id PK
        string name
        string symbol
        int decimals
        string tokenAddress
        string adminAddress
        array complianceModules
        array requiredClaims
        float price
        date createdAt
    }
```

---

## 🎯 Diagrama de Decisión: Compliance Check

```mermaid
flowchart TD
    Start([Transfer Request]) --> GetSender[📍 Get sender address]
    GetSender --> GetRecipient[📍 Get recipient address]
    GetRecipient --> GetToken[💎 Get token contract]
    
    GetToken --> CheckCompliance{¿Token tiene<br/>compliance modules?}
    
    CheckCompliance -->|No| AllowTransfer[✅ Allow Transfer]
    AllowTransfer --> End1([Transfer OK])
    
    CheckCompliance -->|Sí| GetModules[📦 Get compliance modules]
    GetModules --> CheckIdentity{¿Recipient tiene<br/>identity contract?}
    
    CheckIdentity -->|No| RejectNoIdentity[❌ Reject: No identity]
    RejectNoIdentity --> End2([Transfer not compliant])
    
    CheckIdentity -->|Sí| GetIdentity[🆔 Get identity contract]
    GetIdentity --> CheckClaims{¿Tiene TODOS<br/>los claims<br/>requeridos?}
    
    CheckClaims -->|No| ListMissing[📋 List missing claims]
    ListMissing --> RejectNoClaims[❌ Reject: Missing claims]
    RejectNoClaims --> End3([Transfer not compliant])
    
    CheckClaims -->|Sí| VerifyIssuers{¿Claims emitidos<br/>por trusted<br/>issuers?}
    
    VerifyIssuers -->|No| RejectBadIssuer[❌ Reject: Untrusted issuer]
    RejectBadIssuer --> End4([Transfer not compliant])
    
    VerifyIssuers -->|Sí| AllowCompliant[✅ Allow Transfer]
    AllowCompliant --> End5([Transfer compliant ✅])
    
    style AllowTransfer fill:#50C878,color:#fff
    style AllowCompliant fill:#50C878,color:#fff
    style RejectNoIdentity fill:#E74C3C,color:#fff
    style RejectNoClaims fill:#E74C3C,color:#fff
    style RejectBadIssuer fill:#E74C3C,color:#fff
```

---

## 🔄 Diagrama de Ciclo de Vida: Token RWA

```mermaid
stateDiagram-v2
    [*] --> Created: Admin creates token via Factory
    
    Created --> NoCompliance: Initial state
    
    NoCompliance --> WithCompliance: addComplianceModule()
    
    WithCompliance --> PriceSet: Admin sets price
    WithCompliance --> NoPrice: No price set yet
    
    NoPrice --> PriceSet: Admin sets price
    
    PriceSet --> Listed: Visible in Marketplace
    
    Listed --> Purchased: Investor buys (with compliance)
    Listed --> TransferFailed: Buy fails (no compliance)
    
    TransferFailed --> Listed: Investor gets claims
    
    Purchased --> Transferred: Holder transfers to another
    
    Transferred --> Purchased: Continue circulation
    
    NoCompliance --> Paused: Admin pauses
    WithCompliance --> Paused: Admin pauses
    PriceSet --> Paused: Admin pauses
    
    Paused --> WithCompliance: Admin unpauses
    
    note right of NoCompliance
        - No compliance modules
        - Transfers may work
        - No automated checks
    end note
    
    note right of WithCompliance
        - Compliance modules added
        - Automated verification
        - Claims required
    end note
    
    note right of Listed
        - Price set
        - Visible to investors
        - Ready for purchase
    end note
    
    note right of TransferFailed
        - Compliance check failed
        - Missing claims
        - Need to request from issuer
    end note
```

---

## 🌐 Diagrama de Red: Comunicación entre Componentes

```mermaid
graph TB
    subgraph "Client Layer (Browser)"
        UI1[Identity UI<br/>:4001]
        UI2[Registry UI<br/>:4002]
        UI3[Token UI<br/>:4003]
        MM[MetaMask<br/>Web3 Provider]
    end
    
    subgraph "Application Layer (Next.js)"
        API1[Identity API<br/>/api/*]
        API2[Registry API<br/>/api/*]
        API3[Token API<br/>/api/*]
    end
    
    subgraph "Data Layer"
        Mongo[(MongoDB<br/>rwa)]
        GridFS[GridFS<br/>Files]
    end
    
    subgraph "Blockchain Layer"
        RPC[Anvil RPC<br/>:8545]
        SC1[Identity Contracts]
        SC2[Registry Contracts]
        SC3[Token Contracts]
    end
    
    UI1 -->|HTTP GET/POST| API1
    UI2 -->|HTTP GET/POST| API2
    UI3 -->|HTTP GET/POST| API3
    
    UI1 & UI2 & UI3 -->|Web3 Calls| MM
    MM -->|JSON-RPC| RPC
    
    API1 & API2 & API3 -->|MongoDB Driver| Mongo
    API1 & API2 -->|Upload/Download| GridFS
    
    RPC -.->|State| SC1
    RPC -.->|State| SC2
    RPC -.->|State| SC3
    
    API1 -->|Read/Write via RPC| RPC
    API2 -->|Read via RPC| RPC
    API3 -->|Read/Write via RPC| RPC
    
    style UI1 fill:#4A90E2,color:#fff
    style UI2 fill:#7B68EE,color:#fff
    style UI3 fill:#50C878,color:#fff
    style Mongo fill:#13AA52,color:#fff
    style RPC fill:#627EEA,color:#fff
```

---

## 📱 Diagrama de Interfaces de Usuario

```mermaid
graph TB
    subgraph "User Journeys"
        subgraph "Investor Journey"
            IJ1[1. Deploy Identity]
            IJ2[2. Request Claims]
            IJ3[3. Wait Approval]
            IJ4[4. Load Claims]
            IJ5[5. Buy Tokens]
            IJ6[6. Transfer Tokens]
            
            IJ1 --> IJ2 --> IJ3 --> IJ4 --> IJ5 --> IJ6
        end
        
        subgraph "Issuer Journey"
            EJ1[1. Connect as Issuer]
            EJ2[2. View Pending Requests]
            EJ3[3. Review Details]
            EJ4[4. Approve/Reject]
            EJ5[5. Sign Decision]
            
            EJ1 --> EJ2 --> EJ3 --> EJ4 --> EJ5
        end
        
        subgraph "Admin Journey"
            AJ1[1. Create Token]
            AJ2[2. Add Compliance]
            AJ3[3. Set Price]
            AJ4[4. Manage Claims]
            AJ5[5. Monitor Sales]
            
            AJ1 --> AJ2 --> AJ3 --> AJ4 --> AJ5
        end
    end
    
    IJ3 -.->|Depends on| EJ5
    IJ5 -.->|Requires| IJ4
    IJ5 -.->|Buys from| AJ3
    
    style IJ1 fill:#4A90E2,color:#fff
    style EJ1 fill:#7B68EE,color:#fff
    style AJ1 fill:#50C878,color:#fff
```

---

## 🔍 Diagrama de Verificación: Claim Validation

```mermaid
graph TD
    Start([Check if user can transfer]) --> GetIdentity{User has<br/>Identity?}
    
    GetIdentity -->|No| Reject1[❌ REJECT<br/>No identity]
    GetIdentity -->|Yes| GetClaims[Get user's claims<br/>from Identity contract]
    
    GetClaims --> Loop{For each<br/>required claim}
    
    Loop -->|Next claim| CheckClaim{User has<br/>claim topic?}
    
    CheckClaim -->|No| Reject2[❌ REJECT<br/>Missing claim]
    CheckClaim -->|Yes| CheckIssuer{Issued by<br/>trusted issuer?}
    
    CheckIssuer -->|No| Reject3[❌ REJECT<br/>Untrusted issuer]
    CheckIssuer -->|Yes| CheckValid{Claim<br/>still valid?}
    
    CheckValid -->|No| Reject4[❌ REJECT<br/>Expired claim]
    CheckValid -->|Yes| MoreClaims{More claims<br/>to check?}
    
    MoreClaims -->|Yes| Loop
    MoreClaims -->|No| AllValid[✅ All claims valid]
    
    AllValid --> Allow[✅ ALLOW<br/>Transfer compliant]
    
    Reject1 & Reject2 & Reject3 & Reject4 --> End1([Transfer blocked])
    Allow --> End2([Transfer proceeds])
    
    style Allow fill:#50C878,color:#fff
    style AllValid fill:#90EE90,color:#000
    style Reject1 fill:#E74C3C,color:#fff
    style Reject2 fill:#E74C3C,color:#fff
    style Reject3 fill:#E74C3C,color:#fff
    style Reject4 fill:#E74C3C,color:#fff
```

---

## 📋 Resumen de Diagramas

| Diagrama | Tipo | Descripción |
|----------|------|-------------|
| **System Context** | C4 Level 1 | Vista general del sistema y sus usuarios |
| **Container Diagram** | C4 Level 2 | Aplicaciones y cómo se comunican |
| **Component Diagram** | C4 Level 3 | Componentes internos de cada app |
| **Smart Contracts** | Integration | Cómo interactúan los contratos |
| **MongoDB Collections** | Data | Estructura de la base de datos |
| **Claim Lifecycle** | State | Estados de una solicitud de claim |
| **Purchase Flow** | Flow | Proceso de compra de token |
| **Deployment** | Infrastructure | Arquitectura de despliegue |
| **Security** | Sequence | Sistema de firmas digitales |
| **Entity Relationship** | Data | Relaciones entre colecciones |
| **Compliance Check** | Flow | Verificación de compliance |
| **Claim Validation** | Flow | Validación de claims |
| **User Journeys** | Flow | Recorridos de usuarios |

---

## 🎨 Leyenda de Colores

- 🔵 **Azul** (#4A90E2): Identity app / Identidad
- 🟣 **Púrpura** (#7B68EE): Registry app / Issuers
- 🟢 **Verde** (#50C878): Token app / Marketplace
- 🟡 **Amarillo** (#FFD700): Compliance / Módulos
- 🔴 **Rojo** (#E74C3C): Errores / Rechazos
- ⚪ **Gris** (#95A5A6): Infraestructura

---

## 📖 Cómo Leer los Diagramas

### Símbolos Comunes

- `[Rectángulo]`: Componente/Sistema
- `{Diamante}`: Decisión/Condición
- `(Círculo)`: Inicio/Fin
- `-->`: Flujo de datos/control
- `-.->`: Relación/Dependencia
- `===>`: Flujo principal destacado

### Notación Mermaid

Todos los diagramas usan **Mermaid**, compatible con:
- GitHub Markdown
- GitLab
- Visual Studio Code (con extensión)
- Notion
- Obsidian

### Renderizar Localmente

```bash
# Opción 1: VS Code
# Instalar extensión "Markdown Preview Mermaid Support"

# Opción 2: Online
# https://mermaid.live/

# Opción 3: CLI
npm install -g @mermaid-js/mermaid-cli
mmdc -i DIAGRAMA_C4.md -o diagrams.pdf
```

---

## 🎓 Uso Educativo

### Para Presentaciones

1. Abrir este archivo en VS Code con Mermaid extension
2. Exportar cada diagrama como imagen (PNG/SVG)
3. Usar en slides de PowerPoint/Google Slides

### Para Estudio

1. Seguir los diagramas de flujo paso a paso
2. Comparar con el código real en cada app
3. Ejecutar el sistema y verificar cada paso

### Para Desarrollo

1. Usar diagramas como referencia de arquitectura
2. Entender dependencias antes de modificar código
3. Documentar nuevos features con diagramas similares

---

**Versión:** 2.0.0  
**Fecha:** 11 de Noviembre, 2024  
**Formato:** Mermaid Diagrams  

🎨 **Diagramas completos de la arquitectura RWA!**

