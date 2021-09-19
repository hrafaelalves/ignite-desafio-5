import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Head from 'next/head';
import Prismic from '@prismicio/client';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const formattedPost = useMemo(() => {
    const formattedDate = format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    );

    return { ...post, first_publication_date: formattedDate };
  }, [post]);

  const readOfTime = useMemo(() => {
    const words = post.data.content.reduce((accumulate, current) => {
      const { heading, body } = current;

      const countCurrentHeading = heading.split(' ');

      const countBodyCurrent = body.reduce((accumulate_body, current_body) => {
        const countBody = current_body.text.split(' ');

        return accumulate_body + countBody.length;
      }, 0);

      return accumulate + countCurrentHeading.length + countBodyCurrent;
    }, 0);

    return Math.ceil(words / 200);
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  useEffect(() => {
    const scriptParentNode = document.getElementById('comments');
    // if (!scriptParentNode) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'hrafaelalves/spacetraveling-comments');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    // eslint-disable-next-line consistent-return
    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild as Node);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Spacetraveling | {post.data.title}</title>
      </Head>

      <main>
        <img
          className={styles.postBanner}
          src={formattedPost.data.banner.url}
          alt=""
        />
        <article className={`${styles.postContainer} ${commonStyles.wrapper}`}>
          <header>
            <h1>{formattedPost.data.title}</h1>

            <div>
              <time>
                <FiCalendar /> {formattedPost.first_publication_date}
              </time>

              <span>
                <FiUser /> {formattedPost.data.author}
              </span>

              <span>
                <FiClock /> {readOfTime} min
              </span>
            </div>
          </header>

          {formattedPost.data.content.map(item => {
            return (
              <section key={item.heading} className={styles.postContent}>
                <h3>{item.heading}</h3>

                {item.body.map(paragraph => (
                  <div
                    key={paragraph.text}
                    className={styles.postText}
                    dangerouslySetInnerHTML={{ __html: paragraph.text }}
                  />
                ))}
              </section>
            );
          })}

          <section className={styles.postPaginate}>
            <p>teste</p>
          </section>

          <section id="comments" />
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 3,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
    redirect: 60 * 60, // 1 hora
  };
};
