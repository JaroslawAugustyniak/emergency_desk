export const formatOrderNumber = (clientId: number | null, locationId: number | null, orderId: number): string => {
  let number = '';
  if (clientId) {
    number += `C${String(clientId).padStart(3, '0')}/`;
  }
  if (locationId) {
    number += `P${String(locationId).padStart(3, '0')}/`;
  }
  number += `O${String(orderId).padStart(5, '0')}`;
  return number;
};

export const formatPointNumber = (clientId: number | null, locationId: number | null): string => {
  let number = '';
  if (clientId) {
    number += `C${String(clientId).padStart(3, '0')}/`;
  }
  number += `P${String(locationId).padStart(3, '0')}`;
  
  return number;
};

export const formatClientsNumber = (clientId: number | null): string => {
  let number = '';
  
    number += `C${String(clientId).padStart(3, '0')}`;
 
  return number;
};
