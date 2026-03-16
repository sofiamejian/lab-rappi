import express from 'express';
import { NODE_ENV, PORT } from './config';
import cors from 'cors';

import { errorsMiddleware } from './middlewares/errorsMiddleware';

import { router as authRouter } from './features/auth/auth.router';
import { router as storesRouter } from "./features/stores/stores.router"
import { router as productsRouter } from "./features/products/products.router"
import { router as ordersRouter } from "./features/orders/orders.router"

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('API running');
});

// Routes
app.use('/api/auth', authRouter);
app.use("/api/stores", storesRouter)
app.use("/api/products", productsRouter)
app.use("/api/orders", ordersRouter)

// Error middleware
app.use(errorsMiddleware);

app.use((req, res) => {
  console.log("Route not found:", req.method, req.url)
  res.status(404).send("Route not found")
})

if (NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}

export default app;