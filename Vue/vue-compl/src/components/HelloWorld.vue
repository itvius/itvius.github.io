<template>
  <div>
    <article v-for="(location, index) in locations" :key="index">
      <img :src="location.images" />
      <h1>{{ location.name }}</h1>
    </article>
  </div>
</template>

<script>
  import { db } from "../main";
export default {
  name: "HelloWorld",
  data() {
    return {
      locations: []
    };
  },
  props: {
    msg: String
  },
  firestore() {
    return {
      locations: db.collection("location").orderBy("createdAt")
    };
  },
  methods: {
    viewArray() {
      if (this.locations.length !== 0) {
        console.log(this.locations);
      } else {
        console.log(this.locations);
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
