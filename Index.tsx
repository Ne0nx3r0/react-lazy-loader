interface LazyProps{ [key:string]: ()=>Promise<any> }

class Store{
    private _isDispatching:boolean = false;
    private _listeners = [];

    private _dispatch(){
        if(this._isDispatching){
            throw new Error("Cannot call dispatch while dispatching");
        }

        this._isDispatching = true;

        for(const listener of this._listeners){
            try{
                listener();
            }
            catch(ex){
                console.error(ex);
            }
        }

        this._isDispatching = false;
    }

    private _lazyProps:{[key: string]:any} = {};
    private _loadedLazyProps:string[] = [];

    public lazyProp<PropType>(propName:keyof this & string,loaderFunc:()=>Promise<PropType>){
        let fetched = false;

        this._lazyProps[propName] = this[propName];
    
        Object.defineProperty(this, propName, {
            get: function() {
                if(this._loadedLazyProps.indexOf(propName) === -1){
                    this._loadedLazyProps.push(propName);

                    (async()=>{
                        this._lazyProps[propName] = await loaderFunc();

                        this._dispatch();
                    })();
                }
            }
        });
    }

    public refreshLazyProp(propName:keyof this & string){
        return this.refreshLazyProps([propName]);
    }

    public refreshLazyProps(propNames?:string[]){
        if(propNames){
            this._loadedLazyProps = this._loadedLazyProps.filter(p => propNames.indexOf(p) === -1);
        }
        else{
            this._loadedLazyProps = null;
        }

        this._dispatch();
    }

    // Listen for lazy load updates
    public subscribe(func){
        if(this._isDispatching){
            throw new Error("Cannot add listener while dispatching");
        }

        this._listeners.push(func);
    }

    // React useState wrapper for subscribe
    public subscribeComponent(useStateFunc){
        const [update,triggerUpdate] = useStateFunc(0);

        if(update === 0){
            this.subscribe(
                () => triggerUpdate( value =>{ console.log(`value ${value}`); value + 1 })
            );
        }
    }
}

// Example usage

// Store
class ExampleStore extends Store{
   public test:number[] = [];

   constructor(){
       super();

       this.lazyProp('test',fetchFunc);
   }
}

// Some data to load
let value = 0;
async function fetchFunc(){
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    await sleep(1000);

    return value++;
}

// React component
function eSomeComponent(props:{store:ExampleStore}){
    props.store.subscribeComponent(useState);

    return (
        <div className="Test">
            {props.store.test}
        </div>
    );
}





// Dummy useState function
function useState(){

}
