// import pg from "pg";
// const pg = require("pg");
// const pgb = require("pg-promise");
// const { Pool } = pg;

// const { db } = require("@vercel/postgres");

const { sql } = require("@vercel/postgres");

// const pool = new Pool({
//   connectionString: process.env.POSTGRES_URL,
// });

// const db = pgb(pool.connect());

// const client = await db.connect();

let query = function (sql, values) {
  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    db.connect(function (err, connection) {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          // 结束会话
          connection.release();
        });
      }
    });
  });
};

let query1 = function (sql) {
  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    db.connect(function (err, connection) {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
          // 结束会话
          connection.release();
        });
      }
    });
  });
};

async function select(sqlStr) {
  // 查询 users 表中所有的数据
  // const sqlStr = 'select * from user_info'
  console.log(1);
  db.query(sqlStr, (err, results) => {
    // 查询数据失败
    if (err) return console.log(err.message);
    // 查询数据成功
    // 注意：如果执行的是 select 查询语句，则执行的结果是数组
    console.log("dd");
    console.log(results);
  });
}

async function select(sqlStr) {
  // 查询 users 表中所有的数据
  // const sqlStr = 'select * from user_info'
  try {
    const results = await query(sqlStr);
    console.log(sqlStr, results == undefined ? 0 : results.length);
    return results || [];
  } catch (error) {
    console.log(sqlStr, JSON.stringify(params), error);
    return [];
  }
}

async function update(sqlStr, params) {
  try {
    const results = await query(sqlStr, params);
    console.log(sqlStr, JSON.stringify(params), JSON.stringify(results));
    return results;
  } catch (error) {
    console.log(sqlStr, JSON.stringify(params), error);
  }
}

async function insertOrder(order) {
  sql`
        INSERT INTO token_orders (id,project_id,amount,type,tx_hash,price,collateral,status,created_at,seller,buyer,updated_at)
                VALUES (${order.id},${order.project_id},${order.amount},${order.type},${order.tx_hash},${order.price},${order.collateral},${order.status},${order.created_at},${order.seller},${order.buyer},${order.updated_at})
        ON CONFLICT (id) DO NOTHING`;
}

async function updateOrderById(projectId, params) {
  let query = `update token_orders `;

  params.forEach((k, v) => {
    query += ` set ${k} = ${v}`;
  });

  query += ` where project_id = ${projectId}`;

  sql.query(query);
}

async function getDesktopDetail(projectId) {
  return getOrders(null, projectId, null, null, null);
}

async function getOrders(category, projectId, status, page, pageSize) {
  //   const client = await db.connect();
  //   console.log("getOrders", page, pageSize);

  let query =
    "select o.id, o.amount,type,tx_hash,token_name,token_symbol,token_icon,category,price,collateral,status,o.created_at,seller,buyer,updated_at from token_orders o,projects p where o.project_id = p.id ";

  if (category != null) {
    query += ` and category = ${category} `;
  }

  if (projectId != null) {
    query += ` and project_id = ${projectId} `;
  }
  if (status != null) {
    query += ` and status = ${status} `;
  }

  query += `order by o.created_at desc`;

  if (page != null && pageSize != null) {
    query += ` limit ${pageSize} offset ${getLimitOffset(page, pageSize)}`;
  }

  console.log(query);

  const results = await sql.query(query);
  console.log(results);
  let list = [];
  for (let i = 0; i < results.rows.length; i++) {
    let result = results.rows;
    list.push({
      id: result[i].id,
      amount: result[i].amount,
      type: result[i].type,
      tx_hash: result[i].tx_hash,
      token_name: result[i].token_name,
      token_symbol: result[i].token_symbol,
      token_icon: result[i].token_icon,
      category: result[i].category,
      price: result[i].price,
      collateral: result[i].collateral,
      status: result[i].status,
      created_at: result[i].created,
      seller: result[i].seller,
      buyer: result[i].buyer,
      updated_at: result[i].updated_at,
    });
  }
  return list;
}

async function getDetail() {
  let results =
    await sql`    select t1.project_id,t.token_name, t.token_symbol,t.token_icon,t.category,t.created_at,t1.buy_volume,t1.buy_account,t1.sell_volume,t1.sell_account,t.settel_start,t.settel_end from projects t left join
    (select project_id,sum(case when type = 'buy' then amount else 0 end) as buy_volume,
    sum(case when type = 'sell' then amount else 0 end) as sell_volume,
     sum(case when type = 'buy' then 1 else 0 end) as buy_account,
     sum(case when type = 'sell' then 1 else 0 end) as sell_account
 from token_orders o,projects p where p.id = o.project_id and o.created_at > o.created_at - 24 * 3600 and status != 0 group by project_id, type)t1
    on t1.project_id = t.id`;

  let totalResult =
    await sql`select project_id, sum(case when type = 'buy' then amount else 0 end) as total_buy_volume,
    sum(case when type = 'sell' then amount else 0 end) as total_sell_volume,
     sum(case when type = 'buy' then 1 else 0 end) as total_buy_account,
     sum(case when type = 'sell' then 1 else 0 end) as total_sell_account from token_orders o,projects p where o.project_id = p.id and status != 0 group by o.project_id`;

  const dict = {};

  console.log("totalResult:", totalResult.rows);

  totalResult.rows.forEach((item) => {
    dict[item.project_id] = {
      total_buy_volume: item.total_buy_volume,
      total_sell_account: item.total_sell_account,
      total_sell_volume: item.total_sell_volume,
      total_buy_account: item.total_buy_account,
    };
  });

  console.log(results);
  let list = [];
  for (let i = 0; i < results.rows.length; i++) {
    let result = results.rows;
    list.push({
      project_id: result[i].project_id,
      token_name: result[i].token_name,
      token_symbol: result[i].token_symbol,
      token_icon: result[i].token_icon,
      category: result[i].category,
      created_at: result[i].created,
      settel_start: result[i].settel_start,
      settel_end: result[i].settel_end,
      buy_volume: result[i].buy_volume,
      buy_account: result[i].buy_account,
      sell_volume: result[i].sell_volume,
      sell_account: result[i].sell_account,
      total_buy_volume: dict[result[i].project_id].total_buy_volume,
      total_buy_account: dict[result[i].project_id].total_buy_account,
      total_sell_volume: dict[result[i].project_id].total_sell_volume,
      total_sell_account: dict[result[i].project_id].total_sell_account,
    });
  }
  return list;
}

async function getDesktop() {
  //   const client = await db.connect();
  let results =
    await sql`    select t1.project_id,t.token_name, t.token_symbol,t.token_icon,t.category,t.created_at,t1.buy_volume,t1.buy_account,t1.sell_volume,t1.sell_account,t.settel_start,t.settel_end from projects t left join
    (select project_id,sum(case when type = 'buy' then amount else 0 end) as buy_volume,
    sum(case when type = 'sell' then amount else 0 end) as sell_volume,
     sum(case when type = 'buy' then 1 else 0 end) as buy_account,
     sum(case when type = 'sell' then 1 else 0 end) as sell_account
 from token_orders o,projects p where p.id = o.project_id and o.created_at > o.created_at - 24 * 3600 and status != 0 group by project_id)t1
    on t1.project_id = t.id`;

  let totalResult =
    await sql`select project_id, sum(case when type = 'buy' then amount else 0 end) as total_buy_volume,
    sum(case when type = 'sell' then amount else 0 end) as total_sell_volume,
     sum(case when type = 'buy' then 1 else 0 end) as total_buy_account,
     sum(case when type = 'sell' then 1 else 0 end) as total_sell_account from token_orders o,projects p where o.project_id = p.id and status != 0 group by o.project_id`;

  const dict = {};

  console.log("totalResult:", totalResult.rows);

  totalResult.rows.forEach((item) => {
    dict[item.project_id] = {
      total_buy_volume: item.total_buy_volume,
      total_sell_account: item.total_sell_account,
      total_sell_volume: item.total_sell_volume,
      total_buy_account: item.total_buy_account,
    };
  });

  console.log(results);
  let list = [];
  for (let i = 0; i < results.rows.length; i++) {
    let result = results.rows;
    list.push({
      project_id: result[i].project_id,
      token_name: result[i].token_name,
      token_symbol: result[i].token_symbol,
      token_icon: result[i].token_icon,
      category: result[i].category,
      created_at: result[i].created,
      settel_start: result[i].settel_start,
      settel_end: result[i].settel_end,
      buy_volume: result[i].buy_volume,
      buy_account: result[i].buy_account,
      sell_volume: result[i].sell_volume,
      sell_account: result[i].sell_account,
      total_buy_volume: dict[result[i].project_id].total_buy_volume,
      total_buy_account: dict[result[i].project_id].total_buy_account,
      total_sell_volume: dict[result[i].project_id].total_sell_volume,
      total_sell_account: dict[result[i].project_id].total_sell_account,
    });
  }
  return list;
}

function getLimitOffset(page, pageSize) {
  if (page < 1) page = 1;
  let offset = (page - 1) * pageSize;
  return offset;
}

module.exports = { getOrders, getDesktop, getDesktopDetail };
// export { getOrders };
