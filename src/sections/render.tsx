import type { Section } from '@prisma/client';
import type { ComponentType } from 'react';
import { parseSectionContent } from './definitions';
import {
  IconCards,
  IconListImage,
  ImageTextList,
  Legal,
  NumberedCards,
  PageHero,
  PartnerLogos,
  RichText,
  StepsImage,
  StorySplit,
  Team,
  Testimonies,
  Values,
  VisionMission,
} from './common';
import { ContactCards, ContactMain, FormSection, GivingMethods } from './forms';
import {
  AboutIntro,
  CtaBand,
  HomeHero,
  ImageLinkCards,
  LatestNews,
  NavyFeature,
  Pillars,
  Scripture,
  Sponsorship,
  TimelineSection,
} from './home';
import { ArticleBody, MoreNews, NewsHub } from './news';
import { ProgrammeBody, Programmes, RelatedProgrammes } from './programmes';
import type { RenderContext, SectionProps } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, ComponentType<SectionProps<any>>> = {
  homeHero: HomeHero,
  pageHero: PageHero,
  scripture: Scripture,
  aboutIntro: AboutIntro,
  pillars: Pillars,
  programmes: Programmes,
  navyFeature: NavyFeature,
  imageLinkCards: ImageLinkCards,
  sponsorship: Sponsorship,
  timeline: TimelineSection,
  latestNews: LatestNews,
  ctaBand: CtaBand,
  storySplit: StorySplit,
  visionMission: VisionMission,
  values: Values,
  numberedCards: NumberedCards,
  iconCards: IconCards,
  iconListImage: IconListImage,
  formSection: FormSection,
  imageTextList: ImageTextList,
  stepsImage: StepsImage,
  givingMethods: GivingMethods,
  contactCards: ContactCards,
  contactMain: ContactMain,
  legal: Legal,
  newsHub: NewsHub,
  team: Team,
  testimonies: Testimonies,
  partnerLogos: PartnerLogos,
  richText: RichText,
  programmeBody: ProgrammeBody,
  relatedProgrammes: RelatedProgrammes,
  articleBody: ArticleBody,
  moreNews: MoreNews,
};

export function Sections({ sections, ctx = {} }: { sections: Section[]; ctx?: RenderContext }) {
  return (
    <>
      {sections.map((s, i) => {
        const Component = components[s.type];
        if (!Component) return null;
        return (
          <Component
            key={s.id}
            c={parseSectionContent(s.type, s.content)}
            bg={s.background}
            anchor={s.anchor}
            ctx={ctx}
            first={i === 0}
          />
        );
      })}
    </>
  );
}
