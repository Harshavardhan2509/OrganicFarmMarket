#!/usr/bin/env python3
import os
import sys

# Change to the project directory
os.chdir(r'C:\Users\santh\OneDrive\Documents\OrganicFarm')

# List of directories to create
directories = [
    'app/(auth)/login',
    'app/(auth)/register',
    'app/(customer)/dashboard/cart',
    'app/(customer)/dashboard/orders',
    'app/(customer)/dashboard/billing',
    'app/(customer)/dashboard/profile',
    'app/(farmer)/dashboard/inventory/new',
    'app/(farmer)/dashboard/inventory/[id]',
    'app/(farmer)/dashboard/orders/new',
    'app/(farmer)/dashboard/orders/[id]',
    'app/(farmer)/dashboard/analytics',
    'app/api/auth',
    'app/api/products',
    'app/api/orders',
    'app/api/cart',
    'app/api/payments',
    'app/api/analytics',
    'app/api/reviews',
    'components/customer',
    'components/farmer',
    'components/common',
    'components/ui',
    'lib/utils',
    'lib/auth',
    'hooks',
    'contexts',
    'types',
    'styles',
    'public/images',
    'public/icons',
    'prisma',
    'socket',
    'middleware',
    'config',
]

for directory in directories:
    try:
        os.makedirs(directory, exist_ok=True)
        print(f'Created: {directory}')
    except Exception as e:
        print(f'Error creating {directory}: {e}')

print('All directories created successfully!')
