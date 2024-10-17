const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advances = require('../models/advancesModel');

exports.settings = async (req,res) =>{
    try{
        const userId = req.session.user.id;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.redirect('/login');
        }

        res.render('settings',{
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            employeeId: user.employee_id,
            mobile: user.mobile,
            designation: user.designation,
            currentPath: req.url
        })
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}
exports.expenses = (req,res)=>{
    if(req.session.user.role == "admin"){
        const name = req.cookies.name;
        res.render('index',{name: name, currentPath : req.url});
    }else{
        res.render('expenses',{currentPath : req.url});
    }
}

exports.trips = (req,res) =>{
    if(req.session.user.role == "admin"){
        const name = req.cookies.name;
        res.render('index',{name: name, currentPath : req.url});
    }else{
        res.render('trips',{currentPath: req.url});
    }
}


exports.advances = (req,res) =>{
    if(req.session.user.role == "admin"){
        const name = req.cookies.name;
        res.render('index',{name: name, currentPath : req.url});
    }else{
        res.render('advances',{currentPath: req.url});
    }
}

exports.approvals = (req,res) =>{
    if(req.session.user.role == "admin"){
        const name = req.cookies.name;
        res.render('index',{name: name, currentPath : req.url});
    }else{
        res.render('approvals',{currentPath: req.url});
    }
}