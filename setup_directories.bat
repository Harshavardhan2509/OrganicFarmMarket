@echo off
REM Create all necessary directories

mkdir app\(auth)\login
mkdir app\(auth)\register
mkdir app\(customer)\dashboard\cart
mkdir app\(customer)\dashboard\orders
mkdir app\(customer)\dashboard\billing
mkdir app\(customer)\dashboard\profile
mkdir app\(farmer)\dashboard\inventory\new
mkdir app\(farmer)\dashboard\inventory\[id]
mkdir app\(farmer)\dashboard\orders\new
mkdir app\(farmer)\dashboard\orders\[id]
mkdir app\(farmer)\dashboard\analytics
mkdir app\api\auth
mkdir app\api\products
mkdir app\api\orders
mkdir app\api\cart
mkdir app\api\payments
mkdir app\api\analytics
mkdir app\api\reviews
mkdir components\customer
mkdir components\farmer
mkdir components\common
mkdir components\ui
mkdir lib\utils
mkdir lib\auth
mkdir hooks
mkdir contexts
mkdir types
mkdir styles
mkdir public\images
mkdir public\icons
mkdir prisma
mkdir socket
mkdir middleware
mkdir config

echo Directories created successfully!
