function formatNumber(num)
{
   var num_parts = num.toString().split(".");
   num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   return num_parts.join(".");
}
export function updatecard(id,data,changeid,datachange){
   const one=document.getElementById(id);
   one.innerText=`${formatNumber(Number(data))}`
   const two=document.getElementById(changeid)
   if(parseInt(Number(datachange))>=0)
   {
       two.innerText=`+${formatNumber(Number(datachange))}`
    }
    else{
        two.innerText=`- ${formatNumber(Number(datachange))}`

   }

}