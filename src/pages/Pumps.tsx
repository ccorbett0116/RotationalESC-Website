import Layout from "@/components/Layout";

const Pumps = () => {
    return (
        <Layout>
            <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        PLACEHOLDER
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        This site should be easy. My dad wants the different types of pumps as sections:
                        centrifugal, diaphragm, PD, etc (I'll try to get full list from him just make this easily extensible)
                        Then in each section, he wants the logos for the manufacturers (e.g. Grundfos, Goulds, etc again,
                        I'll try to get a full list from him)
                        The logos should be clickable and go to the manufacturer's site (in a new tab?)
                    </p>
                </div>
            </section>
        </Layout>
    );
};

export default Pumps;
