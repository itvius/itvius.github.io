<template>
    <div>
        <div v-for="(location, index) in locations" :key="index">
            <img :src="location.images" style="width: 300px;" />
            <h1>{{ location.name }}</h1>
        </div>
        <div class="paginationBtn">
            <span v-on:click="previousPage()">left</span>
            <span v-on:click="nextPage()">right</span>
        </div>
    </div>
</template>

<script>
    import { db } from "../main";
    export default {
        name: "TodoList",
        data() {
            return {
                locations: []
            };
        },
        firestore() {
            store.commit(db.collection("location").orderBy("createdAt"));
            return {
                locations: db.collection("location").orderBy("createdAt")
            };
        },
        methods: {
            previousPage() {
                console.log('previousPage');
            },
            nextPage() {
                console.log('nextPage');
            },
        },
        beforeMount() {
            store.commit(db.collection("location").orderBy("createdAt"));
        },
        created() {
            console.log(store.state);
            console.log(this.locations);
        }
    }
</script>

<style lang="scss" scoped>
    th {
        text-align: center;
    }
</style>
