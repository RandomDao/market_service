// import pg from "pg";
// const { Pool } = pg;
const { db } = require("@vercel/postgres");

const { orders, projects } = require("./place-holder-data.js");

async function seedProjects(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await client.sql`DROP TABLE IF EXISTS projects`;
    // category: point_market & pre_token
    // Create the "orders" table if it doesn't exist
    const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS projects (
    id integer PRIMARY KEY,   
    token_name VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(255) NOT NULL,
    token_icon VARCHAR(1024) NOT NULL,
    category VARCHAR(255) NOT NULL, 
    created_at  bigint,
    settel_start bigint,
    settel_end bigint
  );
`;

    console.log(`Created "orders" table`);

    // Insert data into the "orders" table
    const insertedorders = await Promise.all(
      projects.map(
        (order) => client.sql`
        INSERT INTO projects (id,token_name,token_symbol,token_icon,category,created_at,settel_start,settel_end)
        VALUES (${order.id},${order.token_name},${order.token_symbol},${order.token_icon},${order.category},${order.created_at},${order.settel_start},${order.settel_end})

        ON CONFLICT (id) DO NOTHING;
      `
      )
    );

    console.log(`Seeded ${insertedorders.length} orders`);

    return {
      createTable,
      orders: insertedorders,
    };
  } catch (error) {
    console.error("Error seeding orders:", error);
    throw error;
  }
}

async function seedOrder(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await client.sql`DROP TABLE IF EXISTS token_orders`;

    // Create the "orders" table if it doesn't exist
    // 状态 0:已挂单 1:已配对 2:交割窗口内，待交割 3:未交割已过期 4:已结束（2，3最终都变为4）
    const createTable = await client.sql`
    CREATE TABLE IF NOT EXISTS token_orders (
    id integer PRIMARY KEY,
    project_id integer NOT NULL,
    amount Bigint not null,
    type VARCHAR(255) NOT NULL, 
    tx_hash VARCHAR(255) NOT NULL,
    price VARCHAR(255) NOT NULL,
    collateral VARCHAR(255) NOT NULL,
    status integer NOT NULL,   
    created_at  bigint ,
    seller VARCHAR(255) NOT NULL,
    buyer VARCHAR(255) NOT NULL,
    updated_at bigint 
  );
`;

    console.log(`Created "orders" table`);

    // Insert data into the "orders" table
    const insertedorders = await Promise.all(
      orders.map(
        (order) => client.sql`
        INSERT INTO token_orders (id,project_id,amount,type,tx_hash,price,collateral,status,created_at,seller,buyer,updated_at)
                VALUES (${order.id},${order.project_id},${order.amount},${order.type},${order.tx_hash},${order.price},${order.collateral},${order.status},${order.created_at},${order.seller},${order.buyer},${order.updated_at})
        ON CONFLICT (id) DO NOTHING;
      `
      )
    );

    console.log(`Seeded ${insertedorders.length} orders`);

    return {
      createTable,
      orders: insertedorders,
    };
  } catch (error) {
    console.error("Error seeding orders:", error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await seedOrder(client);
  await seedProjects(client);
  //   await seedCustomers(client);
  //   await seedorders(client);
  //   await seedRevenue(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
});
