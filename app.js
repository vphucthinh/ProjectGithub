import express from 'express';
import dbConnection from './dbConnection.js';
import routes from './routes.js';
import stripe from "stripe";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3000;


// Middleware to parse JSON requests
app.use(express.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
const corsOptions = {
    methods: 'GET, PUT, POST, DELETE',
    credentials: true,
    optionSuccessStatus: 204,
}
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/checkout', async (req, res) => {
    const rs = req.body.rs;
    let line_items = [];
    console.log(rs);
    for (const product in rs) {
        const quantity = 2;
        line_items.push({
            quantity,
            price_data: {
                currency: 'USD',
                product_data: {name: product.name},
                unit_amount: quantity * 2 * 100,
            },
        });
    }
    const session = await stripe(process.env.STRIPE_SK).checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: 'http://localhost:3001',
        cancel_url: 'http://localhost:3001',
    });
    res.json({
        url: session.url,
    })
})
app.use('/api', routes);

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    res.status(err.statusCode).json({
        message: err.message,
    });
});

// If database is connected successfully, then run the server
dbConnection
    .getConnection()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(`Failed to connect to the database: ${err.message}`);
    });
