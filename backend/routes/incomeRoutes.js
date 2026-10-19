import express from 'express';
import { 
    addIncome , 
    getAllIncome , 
    deleteIncome , 
    downloadIncomeExcel} 
    from "../controllers/incomeControllers.js"
import protect from '../middleware/authMiddleware.js'

const router = express.Router();

router.get("/get" , protect , getAllIncome);
router.get("/downloadexcel" , protect , downloadIncomeExcel);
router.post("/add" , protect , addIncome);
router.delete("/:id" , protect , deleteIncome);

export default router;