import Prismic from '@prismicio/client';
import { GetStaticProps } from 'next';

import { RichText } from 'prismic-dom';
import Head from 'next/head';

import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useEffect, useMemo, useState } from 'react';
import { useCallback } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  const [posts, setPosts] = useState<Post[]>(() => {
    return postsPagination.results.map(post => {
      const formattedDate = format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      );

      return { ...post, first_publication_date: formattedDate };
    });
  });

  const handleLoadMore = useCallback(async () => {
    const response = await fetch(nextPage);
    const { next_page: next_page_fetch, results: results_fetch } =
      await response.json();

    const formattedResults = results_fetch.map(post => {
      return {
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts(prevPosts => [...prevPosts, ...formattedResults]);
    setNextPage(next_page_fetch);
  }, [nextPage]);

  return (
    <>
      <Head>
        <title>Spacetraveling | Home</title>
      </Head>
      <main className={commonStyles.wrapper}>
        {posts &&
          posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.postItem}>
                <section>
                  <h1>{post.data.title}</h1>

                  <p>{post.data.subtitle}</p>

                  <div>
                    <span>
                      <FiCalendar /> {post.first_publication_date}
                    </span>

                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </section>
              </a>
            </Link>
          ))}

        {nextPage && (
          <button
            onClick={handleLoadMore}
            type="button"
            className={styles.loadMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const { next_page } = response;

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page,
      },
    },
  };
};
