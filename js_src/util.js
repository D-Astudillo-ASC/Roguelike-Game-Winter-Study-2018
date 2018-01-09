export function init2DArray(xdim,ydim,initialValue){
  let a =[];
  for (let x = 0; x < xdim; x++)
  {
    a.push([]);
    for(let y = 0; y < ydim; y++)
    {
      a[x].push(initialValue);
    }
  }
  return a;
}
