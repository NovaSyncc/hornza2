// Centralized mock data for consistent property information across all components

export const mockProperties = [
  {
    id: 1,
    title: "Modern 2BR Apartment",
    buildingName: "Building A",
    unitNumber: "2B",
    address: "Section 7, Eastleigh, Nairobi",
    location: "Section 7, Eastleigh",
    bedrooms: 2,
    rent: 45000,
    price: 45000,
    deposit: 45000,
    status: 'verified',
    verified: true,
    instagramUrl: "https://www.instagram.com/p/C12345ABC/",
    managerId: 1,
    managerName: "John Doe",
    managerPhone: "0712345678",
    createdAt: "2024-01-15",
    verifiedAt: "2024-01-20",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop",
    amenities: ['Parking', 'Security', 'Water 24/7', 'CCTV', 'Backup Generator'],
    description: "Beautiful modern apartment with excellent amenities and prime location in Eastleigh. Fully furnished with contemporary design."
  },
  {
    id: 2,
    title: "Executive 1BR Studio",
    buildingName: "Building C",
    unitNumber: "1A",
    address: "Section 1, Eastleigh, Nairobi",
    location: "Section 1, Eastleigh",
    bedrooms: 1,
    rent: 35000,
    price: 35000,
    deposit: 35000,
    status: 'verified',
    verified: true,
    instagramUrl: "https://www.instagram.com/p/C67890DEF/",
    managerId: 2,
    managerName: "Jane Smith",
    managerPhone: "0798765432",
    createdAt: "2024-02-01",
    verifiedAt: "2024-02-05",
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=250&fit=crop",
    amenities: ['Parking', 'Security', 'Water 24/7', 'CCTV'],
    description: "Compact yet luxurious studio apartment perfect for young professionals. Modern finishes throughout."
  },
  {
    id: 3,
    title: "Spacious 3BR Unit",
    buildingName: "Building B",
    unitNumber: "3C",
    address: "Section 3, Eastleigh, Nairobi",
    location: "Section 3, Eastleigh",
    bedrooms: 3,
    rent: 65000,
    price: 65000,
    deposit: 65000,
    status: 'pending',
    verified: false,
    instagramUrl: "",
    managerId: 1,
    managerName: "John Doe",
    managerPhone: "0712345678",
    createdAt: "2024-02-15",
    verifiedAt: null,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop"
    ],
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop",
    amenities: ['Parking', 'Security', 'Backup Generator', 'Garden'],
    description: "Spacious 3-bedroom apartment perfect for families. Pending verification - payment submitted."
  },
  {
    id: 4,
    title: "Budget 2BR Apartment",
    buildingName: "Building D",
    unitNumber: "1B",
    address: "Section 5, Eastleigh, Nairobi",
    location: "Section 5, Eastleigh",
    bedrooms: 2,
    rent: 38000,
    price: 38000,
    deposit: 38000,
    status: 'unverified',
    verified: false,
    instagramUrl: "",
    managerId: 3,
    managerName: "Mike Johnson",
    managerPhone: "0723456789",
    createdAt: "2024-02-20",
    verifiedAt: null,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
    ],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop",
    amenities: ['Parking', 'Security', 'Water 24/7'],
    description: "Affordable 2-bedroom apartment in a quiet neighborhood. Recently listed - verification pending."
  }
];

export const mockBuildings = [
  {
    id: 1,
    title: "Building A - Section 7",
    managerId: 1,
    units: [
      { ...mockProperties.find(p => p.id === 1), unitId: 1 }
    ],
    totalUnits: 1,
    verified: 1,
    pending: 0,
    unverified: 0
  },
  {
    id: 2,
    title: "Building B - Section 3",
    managerId: 1,
    units: [
      { ...mockProperties.find(p => p.id === 3), unitId: 3 }
    ],
    totalUnits: 1,
    verified: 0,
    pending: 1,
    unverified: 0
  }
];

export const mockVerificationRequests = [
  {
    id: 1,
    propertyId: 3,
    property: "Building B - Unit 3C",
    manager: "John Doe",
    managerPhone: "0712345678",
    status: "pending",
    amount: 500,
    requestDate: "2024-02-18",
    address: "Section 3, Eastleigh, Nairobi",
    rent: 65000,
    deposit: 65000
  },
  {
    id: 2,
    propertyId: 4,
    property: "Building D - Unit 1B",
    manager: "Mike Johnson",
    managerPhone: "0723456789",
    status: "pending",
    amount: 500,
    requestDate: "2024-02-22",
    address: "Section 5, Eastleigh, Nairobi",
    rent: 38000,
    deposit: 38000
  }
];

export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    type: "property_manager",
    status: "active",
    buildings: 2,
    joinDate: "2024-01-15",
    phone: "0712345678"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@email.com",
    type: "property_manager",
    status: "active",
    buildings: 1,
    joinDate: "2024-02-01",
    phone: "0798765432"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@email.com",
    type: "property_manager",
    status: "pending",
    buildings: 1,
    joinDate: "2024-02-20",
    phone: "0723456789"
  },
  {
    id: 4,
    name: "Sarah Ahmed",
    email: "sarah.ahmed@email.com",
    type: "tenant",
    status: "active",
    buildings: 0,
    joinDate: "2024-02-10",
    phone: "0734567890"
  },
  {
    id: 5,
    name: "David Kiprotich",
    email: "david.k@email.com",
    type: "tenant",
    status: "active",
    buildings: 0,
    joinDate: "2024-01-28",
    phone: "0745678901"
  }
];

export const mockInquiries = [
  {
    id: 1,
    propertyId: 1,
    property: "Building A - Unit 2B",
    tenant: "Sarah Ahmed",
    tenantPhone: "0734567890",
    message: "Interested in 2BR apartment - KES 45,000",
    timestamp: "2 hours ago",
    status: "new"
  },
  {
    id: 2,
    propertyId: 2,
    property: "Building C - Unit 1A",
    tenant: "David Kiprotich",
    tenantPhone: "0745678901",
    message: "Asking about 1BR availability - KES 35,000",
    timestamp: "5 hours ago",
    status: "contacted"
  }
];