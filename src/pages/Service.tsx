import Layout from "@/components/Layout";
import Gallery from "@/components/Gallery";
import { useCanonical } from "@/hooks/useCanonical";

const Service = () => {
    useCanonical('/service-repair');
    return (
        <Layout>
            <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                        Professional Pump Repair Services
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Our experienced pump repair professionals operate from our fully equipped warehouse, 
                        providing comprehensive repairs and service to many different types of pumps including 
                        centrifugal pumps, diaphragm pumps, positive displacement pumps, and specialized industrial equipment.
                    </p>
                </div>
            </section>
            
            <Gallery 
                title="Service Gallery"
                description="See our pump repair professionals in action"
                galleryType="service"
            />
        </Layout>
    );
};

export default Service;
