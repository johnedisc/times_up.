import { _timesUpApp } from "../main.js";
import { UserDataAPI } from "../services/UserDataAPI.js";

export class IntervalForm extends HTMLElement {

  #newListItem: Record<string | symbol, string | number> = {
    name: "",
    total: 0,
    id: 0
  }

  constructor() {
    super();
    console.log('constructor ', _timesUpApp.store.dataId);
    this.#newListItem.id = parseInt(_timesUpApp.store.dataId);
  }

  intervals():void {
    this.innerHTML = `
      <form data-id=${_timesUpApp.store.dataId}>
        <label for='name'>
          interval name
        </label>
        <input name='name' id='name' type='text' required />

        <label for='total'>
          length in seconds
        </label>
        <input name='total' id='total' type='number' required />
      </form>
    `;

    if (this.dataset.id && this.innerHTML) {
      const formElement = document.querySelector(`form`);
      this.classList.add('flex-down');
      this.setFormBindings(formElement as HTMLFormElement);
    }
  }

  connectedCallback() {
    this.intervals();
  }

  setFormBindings(form: HTMLFormElement) {

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
//      console.log(`this is interval ${this.#newListItem.id}`);

      if (this.dataset.interval_program_id) {
        const intervalName = {
          'interval_name': this.#newListItem.name,
          'sequence_number': this.#newListItem.id,
          'interval_program_id': parseInt(this.dataset.interval_program_id),
          'time_seconds': this.#newListItem.total,
          'token': _timesUpApp.store.user.token
        }

        await UserDataAPI.post('/intervalName', intervalName);
      }

      _timesUpApp.dataId = 0;
      _timesUpApp.router.go('/menu');

    });

    //set dbl data binding
    this.#newListItem = new Proxy(this.#newListItem, {

      //anytime someone sets this fake typescript private property, go through this proxy
      set(target, property, value) {
          target[property] = value;
          const formInputElement = form.elements.namedItem(property.toString());
          if (formInputElement) (formInputElement as HTMLInputElement).value = value;
          return true;
      },
    })

    //get all the form elements and add an event listener on each of them
    //saying when a change occurs
    for (let i = 0; i < form.elements.length; i++) {
      let el = form.elements[i] as HTMLInputElement;
//      console.log(el.name);

      //on change, set the private property to form value
      el.addEventListener('change', () => {
//        console.log(el, el.value);
        let tempVal = el.value;
        this.#newListItem[el.name] = tempVal;
      });
    };
  }
}

