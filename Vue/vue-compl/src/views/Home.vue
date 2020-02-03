<template>
  <div class="home v-application">
    <v-container>
      <v-row class="justify-center" no-gutters>
        <v-col class="col-12 col-sm-6">
          <div style="border: 1px solid ;">
            <TodoList />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script>
// @ is an alias to /src
// import HelloWorld from "@/components/HelloWorld.vue";
import TodoList from "@/components/TodoList.vue";

export default {
  name: "home",
  components: {
    TodoList
  }
};
</script>
