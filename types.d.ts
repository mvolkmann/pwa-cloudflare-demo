declare namespace Demo {
  type Dog = {
    id: number;
    name: string;
    breed: string;
  };

  type RouterMatch = {
    method: string;
    path: string;
    handler: () => Response;
  };
}
