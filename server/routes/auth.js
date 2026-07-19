router.post("/login", async(req,res)=>{

 const {email,password}=req.body;

 const user = await User.findOne({email});

 if(!user){
   return res.status(400).json("User not found");
 }

 if(user.password !== password){
   return res.status(400).json("Wrong password");
 }

 res.json({
   message:"Login successful",
   user
 });

});