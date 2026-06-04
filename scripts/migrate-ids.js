const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting product ID migration...')

  // Fetch all products
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' }
  })

  // Get a set of all current IDs
  const existingIds = new Set(products.map(p => p.id))

  let currentId = 100

  // Helper to find the next unused numeric ID
  function getNextAvailableId() {
    while (existingIds.has(currentId.toString())) {
      currentId++
    }
    const idStr = currentId.toString()
    existingIds.add(idStr) // mark as used
    currentId++
    return idStr
  }

  for (const product of products) {
    const isNumeric = /^\d+$/.test(product.id)

    if (isNumeric) {
      console.log(`Product "${product.name}" already has numeric ID ${product.id}. Keeping it.`)
      continue
    }

    const newId = getNextAvailableId()
    console.log(`Migrating product "${product.name}" (ID: ${product.id}) to new ID: ${newId}`)

    // 1. Create a clone of the product with the new ID
    await prisma.product.create({
      data: {
        id: newId,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
        image: product.image,
        farmerEmail: product.farmerEmail,
        farmerId: product.farmerId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })

    // 2. Update all referencing relations
    // CartItem
    const cartItemsUpdated = await prisma.cartItem.updateMany({
      where: { productId: product.id },
      data: { productId: newId }
    })
    if (cartItemsUpdated.count > 0) {
      console.log(`  Updated ${cartItemsUpdated.count} CartItem(s)`)
    }

    // OrderItem
    const orderItemsUpdated = await prisma.orderItem.updateMany({
      where: { productId: product.id },
      data: { productId: newId }
    })
    if (orderItemsUpdated.count > 0) {
      console.log(`  Updated ${orderItemsUpdated.count} OrderItem(s)`)
    }

    // Review
    const reviewsUpdated = await prisma.review.updateMany({
      where: { productId: product.id },
      data: { productId: newId }
    })
    if (reviewsUpdated.count > 0) {
      console.log(`  Updated ${reviewsUpdated.count} Review(s)`)
    }

    // StockHistory
    const stockHistoryUpdated = await prisma.stockHistory.updateMany({
      where: { productId: product.id },
      data: { productId: newId }
    })
    if (stockHistoryUpdated.count > 0) {
      console.log(`  Updated ${stockHistoryUpdated.count} StockHistory entry/entries`)
    }

    // 3. Delete the original product record
    await prisma.product.delete({
      where: { id: product.id }
    })

    console.log(`  Finished migration for product "${product.name}".`)
  }

  console.log('Product ID migration complete!')
}

main()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
