import Layout from "@/components/Layout";
import Gallery from "@/components/Gallery";

const NewEquipment = () => {
    return (
        <Layout>
            <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        New Equipment for Sale
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Explore our selection of new industrial equipment, including pumps, motors, and accessories. 
                        We offer high-quality products from trusted manufacturers to meet your operational needs. 
                        Browse our gallery below to find the right equipment for your application.
                    </p>
                </div>
            </section>
            
            <Gallery 
                title="New Equipment Gallery"
                description="See some of the equipment our specialists sell"
                galleryType="new-equipment"
            />
        </Layout>
    );
};

export default NewEquipment;
